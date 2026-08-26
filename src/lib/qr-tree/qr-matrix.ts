import QRCode from 'qrcode';

/**
 * QR matrix helpers for the 3D QR-Tree scene.
 *
 * The scene renders a real QR code as a grid of ground tiles: each dark module
 * becomes a raised dark block, each light module a flat light block. Viewed
 * top-down (orthographic) this is an ordinary, scannable QR — the 3D styling is
 * cosmetic, the data lives in the actual QR matrix.
 */

export interface QrMatrix {
  /** Side length in modules (without quiet zone). */
  size: number;
  /** Row-major booleans; true = dark module. Length = size*size. */
  dark: boolean[];
  /** The encoded value. */
  value: string;
}

export type ModuleKind = 'finder' | 'data';

/** Build a QR matrix from a URL/text. ECC 'M' matches the reference (tree.icqr.com). */
export function buildQrMatrix(value: string, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M'): QrMatrix {
  if (!value) throw new Error('buildQrMatrix: value is required');
  const qr = QRCode.create(value, { errorCorrectionLevel });
  const size = qr.modules.size;
  const data = qr.modules.data as unknown as Uint8Array;
  const dark: boolean[] = new Array(size * size);
  for (let i = 0; i < size * size; i++) dark[i] = data[i] === 1;
  return { size, dark, value };
}

const FINDER = 7;

/** Whether a module belongs to one of the three finder patterns (corners). */
export function isFinder(row: number, col: number, size: number): boolean {
  const tl = row < FINDER && col < FINDER;
  const tr = row < FINDER && col >= size - FINDER;
  const bl = row >= size - FINDER && col < FINDER;
  return tl || tr || bl;
}

export function moduleAt(matrix: QrMatrix, row: number, col: number): boolean {
  return matrix.dark[row * matrix.size + col];
}
