'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { QrMatrix, isFinder } from '@/lib/qr-tree/qr-matrix';
import { SeasonPalette } from './palette';

interface QrGroundProps {
  matrix: QrMatrix;
  palette: SeasonPalette;
  /** 0 = isometric styled scene, 1 = flat high-contrast scannable QR. */
  scanRef: React.MutableRefObject<number>;
  tile?: number;
}

const dummy = new THREE.Object3D();
const colorA = new THREE.Color();
const colorB = new THREE.Color();
const tmpColor = new THREE.Color();

/**
 * The QR code rendered as a grid of ground tiles via a single InstancedMesh.
 * Dark modules are raised dark blocks in the styled state and stay dark (but
 * flatten) in the scan state; light modules stay low and pale. Driven by
 * `scanRef` (0..1): tiles flatten and contrast sharpens toward the QR view.
 */
export default function QrGround({ matrix, palette, scanRef, tile = 1 }: QrGroundProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { size, dark } = matrix;
  const count = size * size;

  // Static per-instance metadata computed once.
  const meta = useMemo(() => {
    const isDarkArr = new Uint8Array(count);
    const isFinderArr = new Uint8Array(count);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const i = r * size + c;
        isDarkArr[i] = dark[i] ? 1 : 0;
        isFinderArr[i] = isFinder(r, c, size) ? 1 : 0;
      }
    }
    return { isDarkArr, isFinderArr };
  }, [count, size, dark]);

  const half = (size - 1) / 2;

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const scan = scanRef.current;

    // Styled state: dark tiles raised; scan state: everything flat.
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const i = r * size + c;
        const isDark = meta.isDarkArr[i] === 1;
        const isFin = meta.isFinderArr[i] === 1;

        const raised = isDark ? (isFin ? 0.9 : 0.65) : 0.12;
        const flat = isDark ? 0.08 : 0.02;
        const h = THREE.MathUtils.lerp(raised, flat, scan);

        // Close the inter-tile gaps as it flattens so the QR reads cleanly.
        const footprint = THREE.MathUtils.lerp(tile * 0.98, tile * 1.0, scan);
        dummy.position.set((c - half) * tile, h / 2, (r - half) * tile);
        dummy.scale.set(footprint, h, footprint);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        // Color: styled = stone/pavement palette; scan = pure black/white.
        if (isDark) {
          colorA.set(palette.tileDark);
          colorB.set('#111111');
        } else {
          colorA.set(palette.tileLight);
          colorB.set('#f7f4ea');
        }
        tmpColor.copy(colorA).lerp(colorB, scan);
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
