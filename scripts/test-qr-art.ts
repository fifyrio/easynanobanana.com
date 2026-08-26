/**
 * Reproducible validation harness for the QR-art core.
 * Downloads a few real art bases, blends a QR into each, and independently
 * re-decodes the output to confirm scannability.
 *
 * Run: npx tsx scripts/test-qr-art.ts
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { generateScannableQrArt } from '../src/lib/qr-art/generate-qr-art';

const R2 = 'https://pub-103b451e48574bbfb1a3ca707ebe5cff.r2.dev/showcases';

const CASES = [
  { name: 'portrait', art: `${R2}/ai-black-white-converter/feature/before.png`, url: 'https://www.easynanobanana.com/ai-image-effects/ai-qr-code-art' },
  { name: 'body', art: `${R2}/body-editor/samples/2-after.webp`, url: 'https://www.easynanobanana.com' },
  { name: 'long', art: `${R2}/ai-black-white-converter/feature/before.png`, url: 'https://www.easynanobanana.com/ai-image-effects/ai-black-white-converter?ref=qr-art-test' },
];

async function fetchBuf(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function independentDecode(png: Buffer): Promise<string | null> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const r = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), info.width, info.height);
  return r ? r.data : null;
}

async function main(): Promise<void> {
  const outDir = '/tmp/qr-art-test';
  fs.mkdirSync(outDir, { recursive: true });
  let pass = 0;
  for (const c of CASES) {
    const art = await fetchBuf(c.art);
    const res = await generateScannableQrArt({ artImage: art, url: c.url, moduleSizePx: 16 });
    const outPath = path.join(outDir, `${c.name}.png`);
    fs.writeFileSync(outPath, res.image);
    const decoded = await independentDecode(res.image);
    const ok = decoded === c.url;
    if (ok) pass++;
    console.log(`${c.name.padEnd(10)} scannable=${res.scannable} attempts=${res.attempts} strength=${res.strengthUsed.toFixed(2)} size=${res.sizePx}px | independent-decode=${ok ? 'OK' : 'FAIL'} -> ${outPath}`);
  }
  console.log(`\n${pass}/${CASES.length} passed independent decode.`);
  if (pass !== CASES.length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
