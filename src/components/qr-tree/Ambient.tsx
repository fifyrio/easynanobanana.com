'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeasonPalette } from './palette';
import { getLeafTexture } from './textures';

/**
 * Idle ambient life for the QR-Tree scene (matches the reference):
 * - Butterflies wandering around the canopy and down by the grass
 * - A steady trickle of leaves fluttering down from the canopy
 * Both fade out early in the flatten timeline.
 */

const dummy = new THREE.Object3D();
const col = new THREE.Color();

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUTTERFLY_COLORS = ['#7ec8f0', '#f5a8cc', '#f2d06b'];

interface ButterflyPath {
  baseR: number;
  wobR: number;
  orbitW: number;
  wobW: number;
  baseY: number;
  bobA: number;
  bobW: number;
  phase: number;
  flapW: number;
}

export function Butterflies({ extent, height, scanRef }: {
  extent: number;
  height: number;
  scanRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const wingRefs = useRef<(THREE.Group | null)[]>([]);

  const paths = useMemo<ButterflyPath[]>(() => {
    const rnd = mulberry32(97);
    return BUTTERFLY_COLORS.map((_, i) => ({
      baseR: extent * (0.55 + 0.45 * rnd()),
      wobR: extent * 0.25 * rnd(),
      orbitW: (0.12 + 0.1 * rnd()) * (i % 2 === 0 ? 1 : -1),
      wobW: 0.5 + 0.6 * rnd(),
      baseY: height * (0.15 + 0.45 * rnd()),
      bobA: height * 0.08 * (0.5 + rnd()),
      bobW: 0.8 + 0.9 * rnd(),
      phase: rnd() * Math.PI * 2,
      flapW: 9 + 4 * rnd(),
    }));
  }, [extent, height]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const scan = scanRef.current;
    g.visible = scan < 0.4;
    if (!g.visible) return;
    const t = clock.elapsedTime;

    paths.forEach((p, i) => {
      const holder = g.children[i] as THREE.Group | undefined;
      if (!holder) return;
      const ang = t * p.orbitW + p.phase;
      const r = p.baseR + Math.sin(t * p.wobW + p.phase) * p.wobR;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const y = p.baseY + Math.sin(t * p.bobW + p.phase) * p.bobA + Math.abs(Math.sin(t * p.flapW)) * 0.15;
      holder.position.set(x, y, z);
      // Face direction of travel.
      const heading = ang + (p.orbitW > 0 ? Math.PI / 2 : -Math.PI / 2);
      holder.rotation.set(0, -heading, 0);
      // Flap wings.
      const flap = Math.sin(t * p.flapW + p.phase) * 0.9;
      const wings = wingRefs.current[i];
      if (wings) {
        (wings.children[0] as THREE.Mesh).rotation.y = -0.4 - flap;
        (wings.children[1] as THREE.Mesh).rotation.y = 0.4 + flap;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {BUTTERFLY_COLORS.map((c, i) => (
        <group key={i}>
          <group ref={(el) => { wingRefs.current[i] = el; }}>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[1.1, 0.8]} />
              <meshBasicMaterial color={c} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[1.1, 0.8]} />
              <meshBasicMaterial color={c} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

const DRIFT_COUNT = 14;

export function DriftingLeaves({ extent, height, palette, scanRef }: {
  extent: number;
  height: number;
  palette: SeasonPalette;
  scanRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const leafTexture = useMemo(() => getLeafTexture(), []);

  const drops = useMemo(() => {
    const rnd = mulberry32(555);
    const foliage = palette.foliage.map((c) => new THREE.Color(c));
    return Array.from({ length: DRIFT_COUNT }, () => ({
      // Spawn somewhere inside the canopy footprint.
      sx: (rnd() * 2 - 1) * extent * 0.5,
      sz: (rnd() * 2 - 1) * extent * 0.5,
      sy: height * (0.45 + 0.45 * rnd()),
      dur: 5 + rnd() * 4, // seconds per fall
      off: rnd() * 9, // phase offset
      swayA: 1 + rnd() * 1.6,
      swayW: 1.2 + rnd() * 1.2,
      spin: rnd() * Math.PI * 2,
      scale: 0.55 + rnd() * 0.4,
      color: foliage[Math.floor(rnd() * foliage.length)].clone().multiplyScalar(0.7 + rnd() * 0.3),
    }));
  }, [extent, height, palette]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    drops.forEach((d, i) => mesh.setColorAt(i, col.copy(d.color)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [drops]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const scan = scanRef.current;
    mesh.visible = scan < 0.4;
    if (!mesh.visible) return;
    const t = clock.elapsedTime;

    drops.forEach((d, i) => {
      const cycle = ((t + d.off) % d.dur) / d.dur;
      const y = d.sy * (1 - cycle) + 0.5 * cycle;
      // Shrink briefly at spawn and landing so the loop doesn't pop.
      const fade = Math.min(1, Math.min(cycle / 0.08, (1 - cycle) / 0.08));
      dummy.position.set(
        d.sx + Math.sin(t * d.swayW + d.off) * d.swayA * cycle,
        y,
        d.sz + Math.cos(t * d.swayW * 0.8 + d.off) * d.swayA * 0.6 * cycle
      );
      dummy.rotation.set(d.spin + cycle * 4, d.off + cycle * 3, cycle * 5);
      dummy.scale.setScalar(Math.max(0.0001, d.scale * fade));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DRIFT_COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial map={leafTexture} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.9} />
    </instancedMesh>
  );
}
