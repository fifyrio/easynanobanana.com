'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildQrMatrix } from '@/lib/qr-tree/qr-matrix';
import { SEASON_PALETTES, Season } from './palette';
import QrGround from './QrGround';
import LowPolyTree from './LowPolyTree';
import { getBladeTexture, getLeafTexture } from './textures';
import { Butterflies, DriftingLeaves } from './Ambient';

interface QrTreeCanvasProps {
  value: string;
  season: Season;
  /** true = animate to the flat scannable QR view. */
  scanning: boolean;
  onReady?: () => void;
}

const TILE = 1;

function seedFrom(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
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
 * Organic grass: dense blade clumps in the four corners plus sparse tufts
 * along the edges (like the reference), fading/shrinking away on scan.
 */
function GrassCorners({ extent, palette, scanRef }: {
  extent: number;
  palette: (typeof SEASON_PALETTES)[Season];
  scanRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const bladeTexture = useMemo(() => getBladeTexture(), []);

  const blades = useMemo(() => {
    const rnd = mulberry32(1337);
    const grass = new THREE.Color(palette.grass);
    const items: { x: number; z: number; h: number; rot: number; tilt: number; color: THREE.Color }[] = [];
    const e = extent;
    // Four corner patches.
    const corners = [
      [-e, -e], [e, -e], [-e, e], [e, e],
    ];
    for (const [cx, cz] of corners) {
      const clumps = 9 + Math.floor(rnd() * 3);
      for (let cl = 0; cl < clumps; cl++) {
        const ox = cx - Math.sign(cx) * rnd() * e * 0.42;
        const oz = cz - Math.sign(cz) * rnd() * e * 0.42;
        const n = 16 + Math.floor(rnd() * 10);
        for (let b = 0; b < n; b++) {
          items.push({
            x: ox + (rnd() - 0.5) * 2.2,
            z: oz + (rnd() - 0.5) * 2.2,
            h: 1.3 + rnd() * 1.6,
            rot: rnd() * Math.PI * 2,
            tilt: (rnd() - 0.5) * 0.5,
            color: grass.clone().multiplyScalar(0.65 + rnd() * 0.6),
          });
        }
      }
    }
    // Sparse edge tufts.
    for (let i = 0; i < 110; i++) {
      const side = Math.floor(rnd() * 4);
      const a = (rnd() * 2 - 1) * e;
      const [x, z] = side === 0 ? [a, -e] : side === 1 ? [a, e] : side === 2 ? [-e, a] : [e, a];
      items.push({
        x: x + (rnd() - 0.5) * 0.8,
        z: z + (rnd() - 0.5) * 0.8,
        h: 0.9 + rnd() * 1.1,
        rot: rnd() * Math.PI * 2,
        tilt: (rnd() - 0.5) * 0.5,
        color: grass.clone().multiplyScalar(0.6 + rnd() * 0.55),
      });
    }
    return items;
  }, [extent, palette]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    blades.forEach((b, i) => mesh.setColorAt(i, col.copy(b.color)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [blades]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const scan = scanRef.current;
    mesh.visible = scan < 0.55;
    const shrink = 1 - Math.min(1, scan / 0.5);
    const t = clock.elapsedTime;
    blades.forEach((b, i) => {
      dummy.position.set(b.x, (b.h * shrink) / 2, b.z);
      dummy.rotation.set(0, b.rot, b.tilt + Math.sin(t * 1.4 + i) * 0.1);
      dummy.scale.set(0.85, Math.max(0.001, b.h * shrink), 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, blades.length]} castShadow>
      <planeGeometry args={[0.5, 1]} />
      <meshStandardMaterial map={bladeTexture} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.9} />
    </instancedMesh>
  );
}

/** A few fallen leaves scattered flat on the pavement; fade on scan. */
function LeafLitter({ extent, palette, scanRef }: {
  extent: number;
  palette: (typeof SEASON_PALETTES)[Season];
  scanRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const leafTexture = useMemo(() => getLeafTexture(), []);
  const COUNT = 46;

  const litter = useMemo(() => {
    const rnd = mulberry32(4242);
    const foliage = palette.foliage.map((c) => new THREE.Color(c));
    return Array.from({ length: COUNT }, () => ({
      x: (rnd() * 2 - 1) * extent * 0.85,
      z: (rnd() * 2 - 1) * extent * 0.85,
      rot: rnd() * Math.PI * 2,
      s: 0.45 + rnd() * 0.5,
      color: foliage[Math.floor(rnd() * foliage.length)].clone().multiplyScalar(0.6 + rnd() * 0.35),
    }));
  }, [extent, palette]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    litter.forEach((l, i) => {
      dummy.position.set(l.x, 0.42, l.z);
      dummy.rotation.set(-Math.PI / 2, 0, l.rot);
      dummy.scale.setScalar(l.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, col.copy(l.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [litter]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh) mesh.visible = scanRef.current < 0.45;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial map={leafTexture} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.9} />
    </instancedMesh>
  );
}

/** Drives scan easing + camera transition from isometric to top-down. */
function Rig({ scanning, scanRef, extent, onReady }: {
  scanning: boolean;
  scanRef: React.MutableRefObject<number>;
  extent: number;
  onReady?: () => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  const readyRef = useRef(false);
  const progressRef = useRef(0);
  // Debug/testing aid: ?qrhold=0.35 freezes the master timeline at a fixed
  // progress so mid-transition frames can be inspected deterministically.
  const holdAt = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const v = new URLSearchParams(window.location.search).get('qrhold');
    const n = v === null ? NaN : parseFloat(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null;
  }, []);
  const isoPos = useMemo(() => new THREE.Vector3(1, 0.82, 1).normalize().multiplyScalar(extent * 4), [extent]);
  const topPos = useMemo(() => new THREE.Vector3(0.0001, 1, 0.0001).normalize().multiplyScalar(extent * 4), [extent]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    // Deterministic tween: the full flatten (leaf rain -> trunk sink -> QR
    // reveal) plays over DURATION seconds with smoothstep easing, so the
    // choreography is actually visible (the reference takes ~1.5-2s).
    const DURATION = 2.2;
    const dir = scanning ? 1 : -1;
    progressRef.current = holdAt !== null
      ? holdAt
      : Math.min(1, Math.max(0, progressRef.current + (dir * delta) / DURATION));
    // Master timeline is LINEAR; each sub-animation eases its own window so the
    // choreography reads like the reference: leaves rain down FIRST while the
    // camera holds the isometric view, then the camera sweeps to top-down.
    scanRef.current = progressRef.current;
    if (typeof window !== 'undefined') (window as unknown as { __qrScan?: number }).__qrScan = scanRef.current;
    const k = 1 - Math.pow(0.0015, delta); // camera zoom smoothing

    const s = scanRef.current;
    const camW = Math.min(1, Math.max(0, (s - 0.42) / 0.58));
    const camS = camW * camW * (3 - 2 * camW); // camera window, eased
    target.copy(isoPos).lerp(topPos, camS);
    camera.position.copy(target);
    camera.up.set(0, camS > 0.5 ? 0 : 1, camS > 0.5 ? -1 : 0);
    // Aim above the ground in the isometric view so the tall tree is centred;
    // drop to the ground plane as it flattens.
    lookTarget.set(0, THREE.MathUtils.lerp(extent * 1.05, 0, camS), 0);
    camera.lookAt(lookTarget);

    // r3f's orthographic frustum is in PIXELS; drive zoom from canvas size so
    // the scene fills the frame. The isometric view needs extra vertical
    // headroom for the tall tree; the flat view zooms toward the ground square.
    const px = Math.min(size.width, size.height);
    const isoZoom = px / (extent * 2 * 2.2);
    const flatZoom = px / (extent * 2 * 1.18);
    const targetZoom = THREE.MathUtils.lerp(isoZoom, flatZoom, camS);
    camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, k);
    camera.updateProjectionMatrix();

    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.();
    }
  });
  return null;
}

export default function QrTreeCanvas({ value, season, scanning, onReady }: QrTreeCanvasProps) {
  const matrix = useMemo(() => buildQrMatrix(value || 'https://www.easynanobanana.com', 'M'), [value]);
  const palette = SEASON_PALETTES[season];
  const scanRef = useRef(0);
  const extent = (matrix.size * TILE) / 2;
  const seed = useMemo(() => seedFrom(value || 'x'), [value]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      orthographic
      camera={{ position: [extent * 4, extent * 3.3, extent * 4], zoom: 20, near: 0.1, far: 2000 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={[palette.background]} />
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[extent * 1.5, extent * 3, extent * 1.2]}
        intensity={1.05}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-extent * 2}
        shadow-camera-right={extent * 2}
        shadow-camera-top={extent * 2}
        shadow-camera-bottom={-extent * 2}
      />
      <group position={[0, 0, 0]}>
        {/* Quiet-zone base: light mat that gives the QR a scannable margin. */}
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[(matrix.size + 8) * TILE, (matrix.size + 8) * TILE]} />
          <meshStandardMaterial color={'#fdf9f0'} roughness={0.95} />
        </mesh>
        <QrGround matrix={matrix} palette={palette} scanRef={scanRef} tile={TILE} />
        <GrassCorners extent={extent} palette={palette} scanRef={scanRef} />
        <LeafLitter extent={extent} palette={palette} scanRef={scanRef} />
        <LowPolyTree palette={palette} scanRef={scanRef} seed={seed} height={matrix.size * 1.08} />
        <Butterflies extent={extent} height={matrix.size * 1.08} scanRef={scanRef} />
        <DriftingLeaves extent={extent} height={matrix.size * 1.08} palette={palette} scanRef={scanRef} />
      </group>
      <Rig scanning={scanning} scanRef={scanRef} extent={extent} onReady={onReady} />
    </Canvas>
  );
}
