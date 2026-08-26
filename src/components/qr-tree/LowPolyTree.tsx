'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeasonPalette } from './palette';
import { getLeafTexture } from './textures';

interface LowPolyTreeProps {
  palette: SeasonPalette;
  /** 0 = full tree, 1 = dissolved into the QR ground. */
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

const LEAF_COUNT = 4200;

interface LeafData {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  scale: Float32Array;
  rotX: Float32Array;
  rotY: Float32Array;
  rotZ: Float32Array;
  delay: Float32Array; // 0..0.6 stagger for the falling dissolve
  sway: Float32Array; // phase for idle sway
  colors: THREE.Color[];
}

interface Branch {
  from: THREE.Vector3;
  to: THREE.Vector3;
  radius: number;
}

const easeInQuad = (t: number) => t * t;

/**
 * A feathery maple: thousands of instanced leaf sprites distributed across a
 * tall, billowing multi-lobe canopy, with trunk + branches showing through the
 * gaps. On scan (0..1) each leaf falls with a per-leaf stagger — the tree
 * "rains down" into the ground and becomes the mosaic QR. Idle: gentle sway.
 */
export default function LowPolyTree({ palette, scanRef, seed, height = 12 }: LowPolyTreeProps) {
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const trunkGroupRef = useRef<THREE.Group>(null);
  const leafTexture = useMemo(() => getLeafTexture(), []);

  const H = height;
  const trunkTop = H * 0.52;

  const { leaves, branches } = useMemo(() => {
    const rnd = mulberry32(seed || 1);
    const foliage = palette.foliage.map((c) => new THREE.Color(c));

    // Lobe centres: an upward column that bulges mid-canopy.
    const NUM_LOBES = 13;
    const lobes: { center: THREE.Vector3; radius: number }[] = [];
    for (let i = 0; i < NUM_LOBES; i++) {
      const f = i / (NUM_LOBES - 1);
      const y = H * (0.4 + f * 0.55) + (rnd() - 0.5) * H * 0.05;
      const bulge = Math.sin(Math.min(1, Math.max(0, (y / H - 0.4) / 0.55)) * Math.PI);
      const rad = H * (0.16 + 0.21 * bulge) * (0.85 + 0.3 * rnd());
      const off = H * (0.02 + 0.24 * bulge) * (0.4 + 0.6 * rnd());
      const ang = rnd() * Math.PI * 2;
      lobes.push({ center: new THREE.Vector3(Math.cos(ang) * off, y, Math.sin(ang) * off), radius: rad });
    }
    // Low drooping lobes near the trunk.
    for (let i = 0; i < 4; i++) {
      const ang = rnd() * Math.PI * 2;
      const off = H * (0.13 + 0.1 * rnd());
      lobes.push({
        center: new THREE.Vector3(Math.cos(ang) * off, H * (0.33 + 0.07 * rnd()), Math.sin(ang) * off),
        radius: H * 0.11,
      });
    }

    const leaves: LeafData = {
      x: new Float32Array(LEAF_COUNT),
      y: new Float32Array(LEAF_COUNT),
      z: new Float32Array(LEAF_COUNT),
      scale: new Float32Array(LEAF_COUNT),
      rotX: new Float32Array(LEAF_COUNT),
      rotY: new Float32Array(LEAF_COUNT),
      rotZ: new Float32Array(LEAF_COUNT),
      delay: new Float32Array(LEAF_COUNT),
      sway: new Float32Array(LEAF_COUNT),
      colors: new Array(LEAF_COUNT),
    };

    for (let i = 0; i < LEAF_COUNT; i++) {
      const lobe = lobes[Math.floor(rnd() * lobes.length)];
      // Bias points toward the lobe shell for a fluffy silhouette.
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);
      const rr = lobe.radius * (0.35 + 0.65 * Math.sqrt(rnd()));
      const px = lobe.center.x + rr * Math.sin(phi) * Math.cos(theta);
      const py = lobe.center.y + rr * Math.cos(phi) * 0.85;
      const pz = lobe.center.z + rr * Math.sin(phi) * Math.sin(theta);
      leaves.x[i] = px;
      leaves.y[i] = py;
      leaves.z[i] = pz;
      leaves.scale[i] = H * (0.05 + 0.055 * rnd());
      leaves.rotX[i] = (rnd() - 0.5) * Math.PI;
      leaves.rotY[i] = rnd() * Math.PI * 2;
      leaves.rotZ[i] = (rnd() - 0.5) * Math.PI;
      leaves.delay[i] = rnd() * 0.55;
      leaves.sway[i] = rnd() * Math.PI * 2;

      // Colour: foliage tone, brightness jitter, lighter toward canopy top,
      // darker toward the inside (fake ambient occlusion).
      const base = foliage[Math.floor(rnd() * foliage.length)].clone();
      base.multiplyScalar(0.75 + rnd() * 0.45);
      const topBias = Math.min(1, Math.max(0, (py / H - 0.45) / 0.5));
      base.lerp(white, topBias * 0.16);
      const inner = 1 - Math.min(1, rr / lobe.radius);
      base.multiplyScalar(1 - inner * 0.25);
      leaves.colors[i] = base;
    }

    // Branches reaching up into the canopy.
    const branches: Branch[] = [];
    const NB = 5;
    for (let i = 0; i < NB; i++) {
      const ang = (i / NB) * Math.PI * 2 + rnd() * 0.7;
      const startY = trunkTop * (0.5 + rnd() * 0.35);
      const from = new THREE.Vector3(0, startY, 0);
      const len = H * (0.2 + 0.15 * rnd());
      const to = new THREE.Vector3(Math.cos(ang) * len * 0.85, startY + len, Math.sin(ang) * len * 0.85);
      branches.push({ from, to, radius: H * 0.016 });
    }

    return { leaves, branches };
  }, [seed, H, palette, trunkTop]);

  // Set static instance colours once after mount.
  useLayoutEffect(() => {
    const mesh = canopyRef.current;
    if (!mesh) return;
    for (let i = 0; i < LEAF_COUNT; i++) mesh.setColorAt(i, col.copy(leaves.colors[i]));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [leaves]);

  useFrame(({ clock }) => {
    const scan = scanRef.current;
    const mesh = canopyRef.current;
    const t = clock.elapsedTime;

    if (mesh) {
      mesh.visible = scan < 0.995;
      // Leaves fall with per-leaf stagger over the first ~70% of the scan.
      const leafScan = Math.min(1, scan * 1.45);
      for (let i = 0; i < LEAF_COUNT; i++) {
        const p = Math.min(1, Math.max(0, (leafScan - leaves.delay[i]) / 0.4));
        const fall = easeInQuad(p);
        const y = leaves.y[i] * (1 - fall) + 0.3 * fall;
        const s = leaves.scale[i] * (1 - p * 0.9) * (p >= 1 ? 0 : 1);
        const swayAmp = p > 0 ? 0 : 0.06;
        dummy.position.set(
          leaves.x[i] + Math.sin(t * 0.9 + leaves.sway[i]) * swayAmp,
          y,
          leaves.z[i] + Math.cos(t * 0.7 + leaves.sway[i]) * swayAmp
        );
        dummy.rotation.set(
          leaves.rotX[i] + fall * 2.4,
          leaves.rotY[i] + Math.sin(t * 0.5 + leaves.sway[i]) * 0.1,
          leaves.rotZ[i] + fall * 1.8
        );
        dummy.scale.setScalar(Math.max(0.0001, s));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Trunk sinks after most leaves have fallen.
    const g = trunkGroupRef.current;
    if (g) {
      const trunkScan = Math.min(1, Math.max(0, (scan - 0.45) / 0.4));
      g.scale.set(1 - trunkScan * 0.4, Math.max(0.001, 1 - easeInQuad(trunkScan)), 1 - trunkScan * 0.4);
      g.visible = scan < 0.92;
    }
  });

  return (
    <group>
      <group ref={trunkGroupRef}>
        {/* Trunk: tall tapered cylinder rising into the canopy */}
        <mesh position={[0, trunkTop / 2, 0]} castShadow>
          <cylinderGeometry args={[H * 0.02, H * 0.055, trunkTop, 7]} />
          <meshStandardMaterial color={palette.trunk} roughness={0.92} flatShading />
        </mesh>
        {branches.map((b, i) => {
          const mid = b.from.clone().add(b.to).multiplyScalar(0.5);
          const dir = b.to.clone().sub(b.from);
          const len = dir.length();
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
          return (
            <mesh key={i} position={mid.toArray()} quaternion={q} castShadow>
              <cylinderGeometry args={[b.radius * 0.55, b.radius, len, 5]} />
              <meshStandardMaterial color={palette.trunk} roughness={0.92} flatShading />
            </mesh>
          );
        })}
      </group>
      {/* Canopy: thousands of leaf sprites */}
      <instancedMesh ref={canopyRef} args={[undefined, undefined, LEAF_COUNT]} castShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={leafTexture}
          alphaTest={0.5}
          side={THREE.DoubleSide}
          roughness={0.85}
        />
      </instancedMesh>
    </group>
  );
}
