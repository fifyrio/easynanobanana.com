'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeasonPalette } from './palette';

interface LowPolyTreeProps {
  palette: SeasonPalette;
  /** 0 = full tree, 1 = flattened/faded to reveal the QR. */
  scanRef: React.MutableRefObject<number>;
  /** stable seed so the same URL grows the same tree */
  seed: number;
  height?: number;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dummy = new THREE.Object3D();
const col = new THREE.Color();

/**
 * A stylised low-poly tree: a tapered trunk plus a canopy of instanced
 * icosahedron leaf-clusters, seasonally coloured. On scan (0..1) the whole
 * tree scales down and the canopy fades out to reveal the QR ground beneath —
 * the "tap to flatten into a QR" moment.
 */
export default function LowPolyTree({ palette, scanRef, seed, height = 9 }: LowPolyTreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const canopyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const trunkMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const CLUSTERS = 150;

  // Canopy cluster transforms + colours, seeded by the URL.
  const clusters = useMemo(() => {
    const rnd = mulberry32(seed || 1);
    const items: { pos: THREE.Vector3; scale: number; color: string }[] = [];
    const canopyBase = height * 0.42;
    const canopyH = height * 0.62;
    const rTop = height * 0.42;
    for (let i = 0; i < CLUSTERS; i++) {
      // Distribute inside a slightly egg-shaped ellipsoid.
      const t = rnd();
      const y = canopyBase + t * canopyH;
      const ring = Math.sqrt(1 - Math.pow((y - (canopyBase + canopyH / 2)) / (canopyH / 2), 2));
      const radius = rTop * (0.35 + 0.65 * ring) * (0.7 + 0.6 * rnd());
      const ang = rnd() * Math.PI * 2;
      const pos = new THREE.Vector3(
        Math.cos(ang) * radius,
        y + (rnd() - 0.5) * 0.6,
        Math.sin(ang) * radius
      );
      const scale = height * (0.14 + 0.12 * rnd());
      const color = palette.foliage[Math.floor(rnd() * palette.foliage.length)];
      items.push({ pos, scale, color });
    }
    return items;
  }, [seed, height, palette]);

  // Push cluster matrices/colours once, after the mesh ref is attached.
  useLayoutEffect(() => {
    const mesh = canopyRef.current;
    if (!mesh) return;
    clusters.forEach((c, i) => {
      dummy.position.copy(c.pos);
      dummy.rotation.set(0, i * 1.7, 0);
      dummy.scale.setScalar(c.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, col.set(c.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [clusters]);

  useFrame(() => {
    const scan = scanRef.current;
    const g = groupRef.current;
    if (g) {
      // Shrink toward the ground: vertical squash + slight overall shrink.
      const sY = THREE.MathUtils.lerp(1, 0.02, scan);
      const sXZ = THREE.MathUtils.lerp(1, 0.6, scan);
      g.scale.set(sXZ, sY, sXZ);
      // Hide once faded: even a transparent mesh still casts a shadow, which
      // would blot out the QR centre in the flat view.
      g.visible = scan < 0.9;
    }
    if (canopyMatRef.current) {
      canopyMatRef.current.opacity = THREE.MathUtils.lerp(1, 0, Math.min(1, scan * 1.3));
      canopyMatRef.current.transparent = scan > 0.001;
    }
    if (trunkMatRef.current) {
      trunkMatRef.current.opacity = THREE.MathUtils.lerp(1, 0, Math.min(1, scan * 1.3));
      trunkMatRef.current.transparent = scan > 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Trunk: tapered cylinder */}
      <mesh position={[0, height * 0.28, 0]} castShadow>
        <cylinderGeometry args={[height * 0.035, height * 0.07, height * 0.6, 6]} />
        <meshStandardMaterial ref={trunkMatRef} color={palette.trunk} roughness={0.9} />
      </mesh>
      {/* A couple of branches for silhouette */}
      <mesh position={[height * 0.12, height * 0.42, 0]} rotation={[0, 0, -0.7]} castShadow>
        <cylinderGeometry args={[height * 0.02, height * 0.035, height * 0.3, 5]} />
        <meshStandardMaterial color={palette.trunk} roughness={0.9} />
      </mesh>
      {/* Canopy: instanced leaf clusters */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, CLUSTERS]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial ref={canopyMatRef} flatShading roughness={0.8} />
      </instancedMesh>
    </group>
  );
}
