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
const white = new THREE.Color('#ffffff');

interface Leaf {
  pos: THREE.Vector3;
  scale: number;
  rot: number;
  color: THREE.Color;
}

interface Branch {
  from: THREE.Vector3;
  to: THREE.Vector3;
  radius: number;
}

/**
 * A stylised low-poly maple: a tall trunk with a few branches rising into a
 * billowing, multi-lobed canopy of instanced leaf clusters — taller than wide,
 * lighter toward the top, with a few lower leaves drooping over the ground.
 * On scan (0..1) the whole tree squashes and fades to reveal the QR beneath.
 */
export default function LowPolyTree({ palette, scanRef, seed, height = 12 }: LowPolyTreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const canopyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const trunkMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const H = height;
  const trunkTop = H * 0.5;

  // Build branches + a lobed canopy of leaves, seeded by the URL.
  const { leaves, branches } = useMemo(() => {
    const rnd = mulberry32(seed || 1);
    const foliage = palette.foliage.map((c) => new THREE.Color(c));

    // Canopy lobe centres along an upward-biased column (billowing silhouette).
    const NUM_LOBES = 11;
    const lobes: { center: THREE.Vector3; radius: number; leaves: number }[] = [];
    for (let i = 0; i < NUM_LOBES; i++) {
      const f = i / (NUM_LOBES - 1);
      // Vertical spread from just above trunk to the crown.
      const y = H * (0.42 + f * 0.5) + (rnd() - 0.5) * H * 0.05;
      // Middle of the canopy bulges widest; top and bottom taper.
      const bulge = Math.sin(Math.min(1, Math.max(0, (y / H - 0.42) / 0.5)) * Math.PI);
      const rad = H * (0.13 + 0.16 * bulge) * (0.85 + 0.3 * rnd());
      const off = H * (0.02 + 0.18 * bulge) * (0.4 + 0.6 * rnd());
      const ang = rnd() * Math.PI * 2;
      const center = new THREE.Vector3(Math.cos(ang) * off, y, Math.sin(ang) * off);
      lobes.push({ center, radius: rad, leaves: 26 + Math.floor(rnd() * 12) });
    }
    // A couple of low drooping lobes near the trunk base.
    for (let i = 0; i < 3; i++) {
      const ang = rnd() * Math.PI * 2;
      const off = H * (0.14 + 0.08 * rnd());
      const center = new THREE.Vector3(Math.cos(ang) * off, H * (0.36 + 0.06 * rnd()), Math.sin(ang) * off);
      lobes.push({ center, radius: H * 0.1, leaves: 12 });
    }

    const leaves: Leaf[] = [];
    for (const lobe of lobes) {
      for (let i = 0; i < lobe.leaves; i++) {
        // Point inside the lobe sphere (slightly squashed vertically).
        const u = rnd();
        const v = rnd();
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        const r = lobe.radius * Math.cbrt(rnd());
        const p = new THREE.Vector3(
          lobe.center.x + r * Math.sin(phi) * Math.cos(theta),
          lobe.center.y + r * Math.cos(phi) * 0.85,
          lobe.center.z + r * Math.sin(phi) * Math.sin(theta)
        );
        // Colour: pick a foliage tone, vary brightness, lighten toward the top.
        const base = foliage[Math.floor(rnd() * foliage.length)].clone();
        const bright = 0.8 + rnd() * 0.35;
        base.multiplyScalar(bright);
        const topBias = Math.min(1, Math.max(0, (p.y / H - 0.45) / 0.5));
        base.lerp(white, topBias * 0.14);
        leaves.push({ pos: p, scale: H * (0.055 + 0.045 * rnd()), rot: rnd() * Math.PI * 2, color: base });
      }
    }

    // Branches: main trunk implied by the mesh; add a few upward limbs.
    const branches: Branch[] = [];
    const NB = 4;
    for (let i = 0; i < NB; i++) {
      const ang = (i / NB) * Math.PI * 2 + rnd() * 0.6;
      const startY = trunkTop * (0.55 + rnd() * 0.3);
      const from = new THREE.Vector3(0, startY, 0);
      const len = H * (0.18 + 0.12 * rnd());
      const to = new THREE.Vector3(Math.cos(ang) * len * 0.8, startY + len, Math.sin(ang) * len * 0.8);
      branches.push({ from, to, radius: H * 0.018 });
    }

    return { leaves, branches };
  }, [seed, H, palette, trunkTop]);

  // Push leaf matrices/colours after the instanced mesh mounts.
  useLayoutEffect(() => {
    const mesh = canopyRef.current;
    if (!mesh) return;
    leaves.forEach((l, i) => {
      dummy.position.copy(l.pos);
      dummy.rotation.set(l.rot * 0.4, l.rot, l.rot * 0.25);
      dummy.scale.setScalar(l.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, col.copy(l.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [leaves]);

  useFrame(() => {
    const scan = scanRef.current;
    const g = groupRef.current;
    if (g) {
      const sY = THREE.MathUtils.lerp(1, 0.02, scan);
      const sXZ = THREE.MathUtils.lerp(1, 0.55, scan);
      g.scale.set(sXZ, sY, sXZ);
      // Hide once faded: a transparent mesh still casts a shadow that would
      // blot out the QR centre in the flat view.
      g.visible = scan < 0.9;
    }
    const fade = Math.min(1, scan * 1.3);
    if (canopyMatRef.current) {
      canopyMatRef.current.opacity = THREE.MathUtils.lerp(1, 0, fade);
      canopyMatRef.current.transparent = scan > 0.001;
    }
    if (trunkMatRef.current) {
      trunkMatRef.current.opacity = THREE.MathUtils.lerp(1, 0, fade);
      trunkMatRef.current.transparent = scan > 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Trunk: tall tapered cylinder rising into the canopy */}
      <mesh position={[0, trunkTop / 2, 0]} castShadow>
        <cylinderGeometry args={[H * 0.02, H * 0.06, trunkTop, 7]} />
        <meshStandardMaterial ref={trunkMatRef} color={palette.trunk} roughness={0.92} flatShading />
      </mesh>
      {/* Branches */}
      {branches.map((b, i) => {
        const mid = b.from.clone().add(b.to).multiplyScalar(0.5);
        const dir = b.to.clone().sub(b.from);
        const len = dir.length();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        return (
          <mesh key={i} position={mid.toArray()} quaternion={q} castShadow>
            <cylinderGeometry args={[b.radius * 0.6, b.radius, len, 5]} />
            <meshStandardMaterial color={palette.trunk} roughness={0.92} flatShading />
          </mesh>
        );
      })}
      {/* Canopy: instanced leaf clusters */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, leaves.length]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial ref={canopyMatRef} flatShading roughness={0.85} />
      </instancedMesh>
    </group>
  );
}
