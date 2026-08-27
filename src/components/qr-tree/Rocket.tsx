'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeasonPalette } from './palette';

interface RocketProps {
  palette: SeasonPalette;
  /** 0 = rocket on the pad, 1 = launched away, QR revealed. */
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
const easeInQuad = (t: number) => t * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const SMOKE_COUNT = 42;

/**
 * A low-poly rocket on a launch pad.
 *
 * Idle: blinking nose beacon, cryo vapor wisps venting off the body.
 * Launch (scan 0..1): ignition rumble + flame (0.05-0.2), quadratic liftoff
 * out of frame (0.12-0.6) trailing an expanding smoke ring that dissipates,
 * pad struts fold away — the QR mosaic is revealed beneath. Played backwards
 * it reads as a booster landing.
 */
export default function Rocket({ palette, scanRef, seed, height = 30 }: RocketProps) {
  const rocketRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const flameMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const beaconMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const padRef = useRef<THREE.Group>(null);
  const smokeRef = useRef<THREE.InstancedMesh>(null);
  const vaporRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Rocket proportions from the scene height budget.
  const H = height * 0.52; // rocket stack height
  const R = H * 0.11; // body radius
  const bodyH = H * 0.58;
  const noseH = H * 0.22;
  const padY = 0.9; // pad deck height

  const accents = palette.foliage;
  const bodyColor = '#f6f3ec';
  const noseColor = accents[0];
  const bandColor = accents[1];
  const finColor = accents[0];
  const metal = palette.trunk;

  const smoke = useMemo(() => {
    const rnd = mulberry32(seed || 7);
    return Array.from({ length: SMOKE_COUNT }, (_, i) => ({
      ang: (i / SMOKE_COUNT) * Math.PI * 2 + rnd() * 0.5,
      radial: 3.5 + rnd() * 7,
      rise: 1.2 + rnd() * 3.2,
      size: 1.1 + rnd() * 1.7,
      delay: rnd() * 0.22,
      grey: 0.82 + rnd() * 0.16,
      spin: rnd() * Math.PI * 2,
    }));
  }, [seed]);

  useLayoutEffect(() => {
    const mesh = smokeRef.current;
    if (!mesh) return;
    smoke.forEach((s, i) => mesh.setColorAt(i, col.setScalar(s.grey)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [smoke]);

  useFrame(({ clock }) => {
    const scan = scanRef.current;
    const t = clock.elapsedTime;

    // --- Rocket: rumble then quadratic liftoff out of frame ---
    const g = rocketRef.current;
    if (g) {
      const ignition = clamp01((scan - 0.05) / 0.12);
      const lift = clamp01((scan - 0.14) / 0.5);
      const rumble = ignition * (1 - lift) * 0.14;
      const yOff = easeInQuad(lift) * height * 3.2;
      g.position.set(
        Math.sin(t * 41) * rumble,
        yOff,
        Math.cos(t * 47) * rumble
      );
      g.visible = lift < 1;

      // Flame: appears at ignition, flickers, stretches with speed.
      const flame = flameRef.current;
      if (flame) {
        const on = ignition > 0.15 && lift < 1;
        flame.visible = on;
        if (on) {
          const flicker = 0.85 + Math.sin(t * 34) * 0.12 + Math.sin(t * 51) * 0.08;
          const stretch = 1 + lift * 2.2;
          flame.scale.set(flicker, flicker * stretch, flicker);
        }
        if (flameMatRef.current) {
          flameMatRef.current.color.set(palette.accent);
        }
      }

      // Beacon blink (idle life).
      if (beaconMatRef.current) {
        const blink = (Math.sin(t * 2.6) + 1) / 2;
        beaconMatRef.current.color.copy(col.set('#ff5a4a').multiplyScalar(0.45 + blink * 0.8));
      }
    }

    // --- Pad struts fold away as the rocket clears the tower ---
    const pad = padRef.current;
    if (pad) {
      const fold = clamp01((scan - 0.3) / 0.3);
      pad.children.forEach((child, i) => {
        if (child.name === 'strut') {
          child.rotation.z = ((i % 2 === 0 ? 1 : -1) * fold * Math.PI) / 2.4;
        }
      });
      pad.visible = scan < 0.85;
      const padShrink = 1 - clamp01((scan - 0.6) / 0.25);
      pad.scale.setScalar(Math.max(0.001, padShrink));
    }

    // --- Smoke ring: bursts at ignition, expands + rises + dissipates ---
    const sm = smokeRef.current;
    if (sm) {
      const smokeT = clamp01((scan - 0.08) / 0.55);
      sm.visible = smokeT > 0.001 && smokeT < 1;
      if (sm.visible) {
        smoke.forEach((s, i) => {
          const p = clamp01((smokeT - s.delay) / 0.7);
          const grow = 1 - Math.pow(1 - p, 2); // ease-out expansion
          const x = Math.cos(s.ang) * s.radial * grow;
          const z = Math.sin(s.ang) * s.radial * grow;
          const y = padY + 0.4 + s.rise * grow;
          const dissipate = clamp01((p - 0.55) / 0.45);
          const size = s.size * (0.25 + grow) * (1 - dissipate);
          dummy.position.set(x, y, z);
          dummy.rotation.set(s.spin + p * 2, s.spin, 0);
          dummy.scale.setScalar(Math.max(0.0001, size));
          dummy.updateMatrix();
          sm.setMatrixAt(i, dummy.matrix);
        });
        sm.instanceMatrix.needsUpdate = true;
      }
    }

    // --- Idle cryo vapor wisps rising along the body ---
    vaporRefs.current.forEach((v, i) => {
      if (!v) return;
      const cycle = ((t * 0.35 + i * 0.31) % 1);
      v.visible = scan < 0.1;
      const y = padY + bodyH * (0.25 + cycle * 0.75);
      const drift = 0.4 + cycle * 1.1;
      v.position.set(R + drift * 0.6, y, Math.sin(i * 2.1) * R * 0.6);
      const s = (0.35 + cycle * 0.5) * (1 - Math.pow(cycle, 3));
      v.scale.setScalar(Math.max(0.001, s));
    });
  });

  return (
    <group>
      {/* Launch pad: deck + struts + pad lights */}
      <group ref={padRef}>
        <mesh position={[0, padY / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[H * 0.28, H * 0.32, padY, 8]} />
          <meshStandardMaterial color={metal} roughness={0.8} flatShading />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          return (
            <mesh
              key={i}
              name="strut"
              position={[Math.cos(a) * R * 1.7, padY + H * 0.1, Math.sin(a) * R * 1.7]}
              rotation={[0, -a, 0]}
              castShadow
            >
              <boxGeometry args={[0.35, H * 0.22, 0.35]} />
              <meshStandardMaterial color={metal} roughness={0.85} flatShading />
            </mesh>
          );
        })}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={`l${i}`} position={[Math.cos(a) * H * 0.3, padY + 0.18, Math.sin(a) * H * 0.3]}>
              <sphereGeometry args={[0.16, 6, 6]} />
              <meshBasicMaterial color={i % 2 === 0 ? '#ffd84d' : '#ff8c5a'} />
            </mesh>
          );
        })}
      </group>

      {/* Rocket stack */}
      <group ref={rocketRef}>
        <group position={[0, padY, 0]}>
          {/* Body */}
          <mesh position={[0, bodyH / 2, 0]} castShadow>
            <cylinderGeometry args={[R * 0.92, R, bodyH, 10]} />
            <meshStandardMaterial color={bodyColor} roughness={0.6} flatShading />
          </mesh>
          {/* Band stripe */}
          <mesh position={[0, bodyH * 0.62, 0]}>
            <cylinderGeometry args={[R * 0.945, R * 0.975, bodyH * 0.1, 10]} />
            <meshStandardMaterial color={bandColor} roughness={0.6} flatShading />
          </mesh>
          {/* Window */}
          <mesh position={[0, bodyH * 0.78, R * 0.82]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
            <cylinderGeometry args={[R * 0.3, R * 0.3, 0.14, 12]} />
            <meshStandardMaterial color="#2e3b4a" roughness={0.4} />
          </mesh>
          {/* Nose cone */}
          <mesh position={[0, bodyH + noseH / 2, 0]} castShadow>
            <coneGeometry args={[R * 0.94, noseH, 10]} />
            <meshStandardMaterial color={noseColor} roughness={0.6} flatShading />
          </mesh>
          {/* Beacon */}
          <mesh ref={beaconRef} position={[0, bodyH + noseH + 0.22, 0]}>
            <sphereGeometry args={[0.2, 6, 6]} />
            <meshBasicMaterial ref={beaconMatRef} color="#ff5a4a" />
          </mesh>
          {/* Fins ×3 */}
          {[0, 1, 2].map((i) => {
            const a = (i / 3) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * R * 1.25, bodyH * 0.14, Math.sin(a) * R * 1.25]}
                rotation={[0, -a + Math.PI / 2, 0]}
                castShadow
              >
                <coneGeometry args={[R * 0.55, bodyH * 0.34, 4]} />
                <meshStandardMaterial color={finColor} roughness={0.65} flatShading />
              </mesh>
            );
          })}
          {/* Engine bell */}
          <mesh position={[0, -H * 0.045, 0]}>
            <cylinderGeometry args={[R * 0.5, R * 0.72, H * 0.09, 10]} />
            <meshStandardMaterial color="#4a4f58" roughness={0.5} flatShading />
          </mesh>
          {/* Flame (hidden until ignition) */}
          <mesh ref={flameRef} position={[0, -H * 0.09 - H * 0.11, 0]} rotation={[Math.PI, 0, 0]} visible={false}>
            <coneGeometry args={[R * 0.55, H * 0.22, 8]} />
            <meshBasicMaterial ref={flameMatRef} color="#ff8c2e" />
          </mesh>
        </group>
      </group>

      {/* Smoke puffs */}
      <instancedMesh ref={smokeRef} args={[undefined, undefined, SMOKE_COUNT]} visible={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} flatShading />
      </instancedMesh>

      {/* Idle vapor wisps */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} ref={(el) => { vaporRefs.current[i] = el; }}>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#ffffff" roughness={1} flatShading transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}
