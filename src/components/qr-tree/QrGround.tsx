'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { QrMatrix, isFinder } from '@/lib/qr-tree/qr-matrix';
import { SeasonPalette } from './palette';

interface QrGroundProps {
  matrix: QrMatrix;
  palette: SeasonPalette;
  /** 0 = isometric styled scene, 1 = flat mosaic scannable QR. */
  scanRef: React.MutableRefObject<number>;
  tile?: number;
}

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The QR code rendered as a grid of ground tiles via a single InstancedMesh.
 *
 * Two visual states, blended by scanRef (0..1):
 * - Tree state: a subtle stone-plaza checker — dark modules only slightly
 *   darker and gently raised, so the ground reads as pavement, not a QR.
 * - Flat state: a green mosaic QR — dark modules become deep foliage greens
 *   with per-tile shade variation (sparse olive accents), light modules warm
 *   creams. The tree's colour DNA becomes the code, and the green-on-cream
 *   luminance gap keeps it scannable.
 */
export default function QrGround({ matrix, palette, scanRef, tile = 1 }: QrGroundProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { size, dark } = matrix;
  const count = size * size;

  // Per-tile static data: kind flags + precomputed tree/flat colours.
  const tiles = useMemo(() => {
    const rnd = mulberry32(size * 7919 + 17);
    const isDarkArr = new Uint8Array(count);
    const isFinderArr = new Uint8Array(count);
    const treeColors: THREE.Color[] = new Array(count);
    const flatColors: THREE.Color[] = new Array(count);

    const qrDark = palette.qrDark.map((c) => new THREE.Color(c));
    const qrAccent = palette.qrDarkAccent.map((c) => new THREE.Color(c));
    const qrLight = palette.qrLight.map((c) => new THREE.Color(c));
    const treeDark = new THREE.Color(palette.tileDark);
    const treeLight = new THREE.Color(palette.tileLight);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const i = r * size + c;
        const isDark = dark[i];
        isDarkArr[i] = isDark ? 1 : 0;
        isFinderArr[i] = isFinder(r, c, size) ? 1 : 0;

        // Tree state: subtle pavement with tiny per-tile brightness jitter.
        const jitter = 0.96 + rnd() * 0.08;
        treeColors[i] = (isDark ? treeDark : treeLight).clone().multiplyScalar(jitter);

        // Flat state: mosaic. Finder darks use the deepest green for reliable
        // detection; other darks pick a random shade (sparse accents).
        if (isDark) {
          if (isFinderArr[i]) {
            flatColors[i] = qrDark[3].clone(); // deepest tone
          } else if (rnd() < 0.12 && qrAccent.length) {
            flatColors[i] = qrAccent[Math.floor(rnd() * qrAccent.length)].clone();
          } else {
            flatColors[i] = qrDark[Math.floor(rnd() * qrDark.length)].clone();
          }
          flatColors[i].multiplyScalar(0.88 + rnd() * 0.14);
        } else {
          flatColors[i] = qrLight[Math.floor(rnd() * qrLight.length)].clone();
        }
      }
    }
    return { isDarkArr, isFinderArr, treeColors, flatColors };
  }, [count, size, dark, palette]);

  const half = (size - 1) / 2;

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const raw = scanRef.current;
    // Mosaic reveal happens mid-to-late on the master timeline, eased.
    const w = Math.min(1, Math.max(0, (raw - 0.35) / 0.6));
    const scan = w * w * (3 - 2 * w);

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const i = r * size + c;
        const isDark = tiles.isDarkArr[i] === 1;

        // Tree state: gentle pavement relief; flat state: near-flat mosaic.
        const raised = isDark ? 0.34 : 0.12;
        const flat = isDark ? 0.09 : 0.05;
        const h = THREE.MathUtils.lerp(raised, flat, scan);

        // Close the inter-tile gaps as it flattens so the QR reads cleanly.
        const footprint = THREE.MathUtils.lerp(tile * 0.97, tile * 1.0, scan);
        dummy.position.set((c - half) * tile, h / 2, (r - half) * tile);
        dummy.scale.set(footprint, h, footprint);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        tmpColor.copy(tiles.treeColors[i]).lerp(tiles.flatColors[i], scan);
        mesh.setColorAt(i, tmpColor);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.85} metalness={0.02} />
    </instancedMesh>
  );
}
