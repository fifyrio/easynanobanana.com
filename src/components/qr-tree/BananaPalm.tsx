'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeasonPalette } from './palette';
import { getLeafTexture } from './textures';

interface BananaPalmProps {
  palette: SeasonPalette;
  /** 0 = full palm, 1 = dissolved into the QR ground. */
  scanRef: React.MutableRefObject<number>;
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
const easeInQuad = (t: number) => t * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

interface Leaflet {
  x: number; y: number; z: number;
  scale: number; ex: number; // ex = elongation (y stretch)
  rx: number; ry: number; rz: number;
  delay: number; sway: number; swayReach: number;
  color: THREE.Color;
}

interface Banana { x: number; y: number; z: number; ry: number; rz: number; len: number; color: THREE.Color; }
interface Bunch { x: number; z: number; y: number; bananas: Banana[]; delay: number; }

/**
 * A stylised banana palm — Easy Nano Banana's signature centerpiece.
 * A curved trunk crowned with drooping palm fronds (instanced leaflets) and a
 * couple of hanging banana bunches. Idle: fronds and bananas sway. On scan the
 * leaflets rain down and bunches drop into the QR ground, then the trunk sinks.
 */
export default function BananaPalm({ palette, scanRef, seed, height = 30 }: BananaPalmProps) {
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const trunkGroupRef = useRef<THREE.Group>(null);
  const bunchRefs = useRef<(THREE.Group | null)[]>([]);
  const leafTexture = useMemo(() => getLeafTexture(), []);

  const H = height;
  const trunkH = H * 0.62;
  const leanX = H * 0.06; // gentle curve of the trunk

  const { leaflets, bunches, crown } = useMemo(() => {
    const rnd = mulberry32(seed || 3);
    const greens = palette.foliage.map((c) => new THREE.Color(c));
    const crown = new THREE.Vector3(leanX, trunkH, 0);

    // --- Fronds: leaflets arranged along drooping ribs radiating from crown ---
    const NF = 10; // fronds
    const SAMPLES = 22;
    const leaflets: Leaflet[] = [];
    for (let f = 0; f < NF; f++) {
      const az = (f / NF) * Math.PI * 2 + rnd() * 0.35;
      const reach = H * (0.42 + rnd() * 0.12);
      const up = H * (0.12 + rnd() * 0.06);
      const droop = H * (0.34 + rnd() * 0.1);
      const dirX = Math.cos(az);
      const dirZ = Math.sin(az);
      for (let s = 1; s <= SAMPLES; s++) {
        const u = s / SAMPLES;
        const r = u * reach;
        // rib arcs up then droops (palm silhouette)
        const ribY = crown.y + Math.sin(u * Math.PI) * up - u * u * droop;
        const cx = crown.x + dirX * r;
        const cz = crown.z + dirZ * r;
        const leafletLen = (1 - u * 0.55) * H * 0.05;
        // one leaflet each side of the rib
        for (const side of [-1, 1]) {
          const perpX = -dirZ * side;
          const perpZ = dirX * side;
          const spread = leafletLen * 2.1;
          const base = greens[Math.floor(rnd() * greens.length)].clone();
          base.multiplyScalar(0.72 + rnd() * 0.4);
          base.lerp(white, clamp01((ribY / H - 0.5)) * 0.14);
          leaflets.push({
            x: cx + perpX * spread * 0.5,
            y: ribY - 0.1,
            z: cz + perpZ * spread * 0.5,
            scale: leafletLen,
            ex: 2.6 + rnd() * 0.8,
            rx: -0.4 + (rnd() - 0.5) * 0.3,
            ry: az + side * 0.5 + Math.PI / 2,
            rz: (rnd() - 0.5) * 0.4,
            delay: (u * 0.4 + rnd() * 0.25),
            sway: rnd() * Math.PI * 2,
            swayReach: 0.05 + u * 0.35, // tips sway more
            color: base,
          });
        }
      }
    }

    // --- Hanging banana bunches near the crown ---
    const ripe = new THREE.Color(palette.accent);
    const NB = 2 + Math.floor(rnd() * 2);
    const bunches: Bunch[] = [];
    for (let b = 0; b < NB; b++) {
      const az = rnd() * Math.PI * 2;
      const off = H * 0.1;
      const bx = crown.x + Math.cos(az) * off;
      const bz = crown.z + Math.sin(az) * off;
      const by = crown.y - H * 0.04;
      const bananas: Banana[] = [];
      const hands = 2 + Math.floor(rnd() * 2);
      for (let h = 0; h < hands; h++) {
        const hy = -h * H * 0.05;
        const perHand = 5 + Math.floor(rnd() * 3);
        for (let i = 0; i < perHand; i++) {
          const a = (i / perHand) * Math.PI * 2;
          const c = ripe.clone().multiplyScalar(0.85 + rnd() * 0.25);
          bananas.push({
            x: Math.cos(a) * H * 0.028,
            y: hy,
            z: Math.sin(a) * H * 0.028,
            ry: a,
            rz: 0.5 + rnd() * 0.3, // curve up-outward
            len: H * (0.055 + rnd() * 0.02),
            color: c,
          });
        }
      }
      bunches.push({ x: bx, z: bz, y: by, bananas, delay: rnd() * 0.3 });
    }

    return { leaflets, bunches, crown };
  }, [seed, H, palette, trunkH, leanX]);

  useLayoutEffect(() => {
    const mesh = leafRef.current;
    if (!mesh) return;
    leaflets.forEach((l, i) => mesh.setColorAt(i, col.copy(l.color)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [leaflets]);

  useFrame(({ clock }) => {
    const scan = scanRef.current;
    const t = clock.elapsedTime;

    // Leaflets: idle sway, then staggered fall (first ~62% of the timeline).
    const mesh = leafRef.current;
    if (mesh) {
      mesh.visible = scan < 0.98;
      const leafScan = Math.min(1, scan / 0.62);
      for (let i = 0; i < leaflets.length; i++) {
        const l = leaflets[i];
        const p = clamp01((leafScan - l.delay) / 0.5);
        const fall = easeInQuad(p);
        const swayX = p > 0 ? 0 : Math.sin(t * 1.1 + l.sway) * l.swayReach;
        const swayZ = p > 0 ? 0 : Math.cos(t * 0.9 + l.sway) * l.swayReach;
        const flutter = Math.sin(l.sway + fall * 6) * 1.2 * fall;
        dummy.position.set(l.x + swayX + flutter, l.y * (1 - fall) + 0.4 * fall, l.z + swayZ + flutter * 0.5);
        dummy.rotation.set(l.rx + fall * 4.5, l.ry + Math.sin(t + l.sway) * 0.08 + fall * 2, l.rz + fall * 3);
        const sc = l.scale * (1 - 0.3 * fall) * (p >= 0.985 ? 0 : 1);
        dummy.scale.set(Math.max(0.0001, sc), Math.max(0.0001, sc * l.ex), Math.max(0.0001, sc));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Banana bunches: idle bob, then drop.
    bunches.forEach((bunch, i) => {
      const g = bunchRefs.current[i];
      if (!g) return;
      const p = clamp01((Math.min(1, scan / 0.62) - bunch.delay) / 0.45);
      const drop = easeInQuad(p);
      g.visible = scan < 0.9;
      g.position.set(bunch.x, bunch.y * (1 - drop) + 0.5 * drop, bunch.z);
      g.rotation.set(drop * 3, Math.sin(t * 0.8 + i) * 0.05, Math.sin(t * 1.3 + i) * 0.08 + drop * 2);
      const s = 1 - 0.2 * drop;
      g.scale.setScalar(Math.max(0.001, s * (p >= 0.99 ? 0.001 : 1)));
    });

    // Trunk sinks after fronds have mostly fallen.
    const trunk = trunkGroupRef.current;
    if (trunk) {
      const ts = clamp01((scan - 0.5) / 0.32);
      const radial = Math.max(0.001, 1 - ts);
      trunk.scale.set(radial, Math.max(0.001, 1 - easeInQuad(ts)), radial);
      trunk.visible = scan < 0.85;
    }
  });

  // Trunk: stacked slightly-curved segments.
  const trunkSegs = 7;

  return (
    <group>
      <group ref={trunkGroupRef}>
        {Array.from({ length: trunkSegs }).map((_, i) => {
          const u = i / (trunkSegs - 1);
          const y = u * trunkH;
          const x = Math.sin(u * 0.9) * leanX;
          const r = THREE.MathUtils.lerp(H * 0.05, H * 0.032, u);
          return (
            <mesh key={i} position={[x, y + trunkH / trunkSegs / 2, 0]} castShadow>
              <cylinderGeometry args={[r * 0.92, r, trunkH / trunkSegs + 0.4, 8]} />
              <meshStandardMaterial color={palette.trunk} roughness={0.9} flatShading />
            </mesh>
          );
        })}
        {/* crown base */}
        <mesh position={[crown.x, crown.y, crown.z]} castShadow>
          <sphereGeometry args={[H * 0.05, 8, 6]} />
          <meshStandardMaterial color={palette.trunk} roughness={0.9} flatShading />
        </mesh>

        {/* Banana bunches */}
        {bunches.map((bunch, bi) => (
          <group key={bi} ref={(el) => { bunchRefs.current[bi] = el; }} position={[bunch.x, bunch.y, bunch.z]}>
            {/* stem */}
            <mesh position={[0, H * 0.03, 0]}>
              <cylinderGeometry args={[H * 0.008, H * 0.012, H * 0.08, 5]} />
              <meshStandardMaterial color={palette.trunk} roughness={0.9} flatShading />
            </mesh>
            {bunch.bananas.map((bn, k) => (
              <mesh
                key={k}
                position={[bn.x, bn.y, bn.z]}
                rotation={[0, bn.ry, bn.rz]}
                castShadow
              >
                <coneGeometry args={[bn.len * 0.22, bn.len, 5]} />
                <meshStandardMaterial color={bn.color} roughness={0.55} flatShading />
              </mesh>
            ))}
            {/* purple bud at the tip */}
            <mesh position={[0, -H * 0.05, 0]}>
              <coneGeometry args={[H * 0.02, H * 0.05, 6]} />
              <meshStandardMaterial color="#7a3b6b" roughness={0.7} flatShading />
            </mesh>
          </group>
        ))}
      </group>

      {/* Frond leaflets */}
      <instancedMesh ref={leafRef} args={[undefined, undefined, leaflets.length]} castShadow>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial map={leafTexture} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.85} />
      </instancedMesh>
    </group>
  );
}
