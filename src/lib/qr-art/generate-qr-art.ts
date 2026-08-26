import QRCode from 'qrcode';
import jsQR from 'jsqr';
import sharp from 'sharp';

/**
 * Blend a scannable QR code into an art image and VALIDATE it decodes.
 *
 * Approach (no ControlNet): render the QR at Level H (~30% error correction),
 * keep the three finder patterns pixel-solid, and in every data module stamp a
 * center dot of the module colour while letting the art image show through the
 * module gaps. A higher "strength" grows the dots and the per-module contrast
 * push. After compositing we decode the result with jsQR; if it fails (or
 * decodes to the wrong URL) we raise the strength and retry. The art is only
 * cosmetic in the module gaps — the dots + finders carry the actual data, which
 * is what keeps scan-success high.
 */

export interface QrArtOptions {
  /** Art base image (any format sharp can read). */
  artImage: Buffer;
  /** URL/text to encode. */
  url: string;
  /** Pixels per QR module. Larger = crisper, bigger output. Default 16. */
  moduleSizePx?: number;
  /** Quiet-zone width in modules (white border). Default 4. */
  quietZoneModules?: number;
  /** Max retry attempts escalating strength. Default 4. */
  maxAttempts?: number;
}

export interface QrArtResult {
  /** Final PNG buffer. */
  image: Buffer;
  /** Whether jsQR decoded it back to the exact URL. */
  scannable: boolean;
  /** Attempts used (1-based). */
  attempts: number;
  /** Final dot strength in [0,1] that was used. */
  strengthUsed: number;
  /** Output side length in pixels. */
  sizePx: number;
}

const FINDER_SIZE = 7; // finder patterns are 7x7 modules at three corners

function isFinderModule(row: number, col: number, size: number): boolean {
  const inTopLeft = row < FINDER_SIZE && col < FINDER_SIZE;
  const inTopRight = row < FINDER_SIZE && col >= size - FINDER_SIZE;
  const inBottomLeft = row >= size - FINDER_SIZE && col < FINDER_SIZE;
  return inTopLeft || inTopRight || inBottomLeft;
}

/**
 * Composite one attempt at a given strength and return the raw RGBA buffer.
 */
async function composeAttempt(
  artRaw: Buffer,
  matrix: Uint8Array,
  modSize: number,
  moduleSizePx: number,
  quietZoneModules: number,
  totalPx: number,
  strength: number
): Promise<Buffer> {
  // Output buffer starts white (quiet zone + fallback).
  const out = Buffer.alloc(totalPx * totalPx * 4, 255);
  const offsetPx = quietZoneModules * moduleSizePx;
  const dotRadius = (moduleSizePx / 2) * (0.55 + 0.45 * strength); // grows with strength
  const artMix = 0.12 + 0.33 * strength; // per-module contrast push toward module colour
  const center = moduleSizePx / 2;

  for (let row = 0; row < modSize; row++) {
    for (let col = 0; col < modSize; col++) {
      const isDark = matrix[row * modSize + col] === 1;
      const moduleVal = isDark ? 0 : 255;
      const finder = isFinderModule(row, col, modSize);

      const baseY = offsetPx + row * moduleSizePx;
      const baseX = offsetPx + col * moduleSizePx;

      for (let py = 0; py < moduleSizePx; py++) {
        for (let px = 0; px < moduleSizePx; px++) {
          const gy = baseY + py;
          const gx = baseX + px;
          const outIdx = (gy * totalPx + gx) * 4;

          if (finder) {
            // Finder patterns must stay pixel-solid for reliable detection.
            out[outIdx] = moduleVal;
            out[outIdx + 1] = moduleVal;
            out[outIdx + 2] = moduleVal;
            out[outIdx + 3] = 255;
            continue;
          }

          // Art pixel at the corresponding location.
          const artIdx = (gy * totalPx + gx) * 4;
          const ar = artRaw[artIdx];
          const ag = artRaw[artIdx + 1];
          const ab = artRaw[artIdx + 2];

          const dx = px - center;
          const dy = py - center;
          const withinDot = dx * dx + dy * dy <= dotRadius * dotRadius;

          if (withinDot) {
            out[outIdx] = moduleVal;
            out[outIdx + 1] = moduleVal;
            out[outIdx + 2] = moduleVal;
          } else {
            // Keep art but nudge toward the module colour for module contrast.
            out[outIdx] = Math.round(ar * (1 - artMix) + moduleVal * artMix);
            out[outIdx + 1] = Math.round(ag * (1 - artMix) + moduleVal * artMix);
            out[outIdx + 2] = Math.round(ab * (1 - artMix) + moduleVal * artMix);
          }
          out[outIdx + 3] = 255;
        }
      }
    }
  }
  return out;
}

export async function generateScannableQrArt(opts: QrArtOptions): Promise<QrArtResult> {
  const moduleSizePx = opts.moduleSizePx ?? 16;
  const quietZoneModules = opts.quietZoneModules ?? 4;
  const maxAttempts = opts.maxAttempts ?? 4;

  if (!opts.url || opts.url.length === 0) {
    throw new Error('generateScannableQrArt: url is required');
  }

  const qr = QRCode.create(opts.url, { errorCorrectionLevel: 'H' });
  const modSize = qr.modules.size;
  const matrix = qr.modules.data as unknown as Uint8Array;
  const totalModules = modSize + quietZoneModules * 2;
  const totalPx = totalModules * moduleSizePx;

  // Prepare the art layer once: cover-fit to the QR area, full opaque RGBA.
  const artRaw = await sharp(opts.artImage)
    .resize(totalPx, totalPx, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .raw()
    .toBuffer();

  let lastRaw: Buffer | null = null;
  let strengthUsed = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Strength escalates 0 -> 1 across attempts.
    const strength = maxAttempts === 1 ? 0.5 : (attempt - 1) / (maxAttempts - 1);
    strengthUsed = strength;

    const raw = await composeAttempt(
      artRaw, matrix, modSize, moduleSizePx, quietZoneModules, totalPx, strength
    );
    lastRaw = raw;

    // Validate: jsQR needs Uint8ClampedArray RGBA.
    const decoded = jsQR(new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.length), totalPx, totalPx);
    if (decoded && decoded.data === opts.url) {
      const png = await sharp(raw, { raw: { width: totalPx, height: totalPx, channels: 4 } }).png().toBuffer();
      return { image: png, scannable: true, attempts: attempt, strengthUsed, sizePx: totalPx };
    }
  }

  // All attempts failed to validate — return the strongest attempt, flagged.
  const png = await sharp(lastRaw!, { raw: { width: totalPx, height: totalPx, channels: 4 } }).png().toBuffer();
  return { image: png, scannable: false, attempts: maxAttempts, strengthUsed, sizePx: totalPx };
}
