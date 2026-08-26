'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildQrMatrix } from '@/lib/qr-tree/qr-matrix';
import { SEASON_PALETTES, Season } from './palette';
import QrGround from './QrGround';
import LowPolyTree from './LowPolyTree';

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

/** Grass tufts around the ground border; fade out on scan. */
function GrassBorder({ extent, color, scanRef }: { extent: number; color: string; scanRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tufts = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    const e = extent + 0.5;
    const step = 0.9;
    for (let x = -e; x <= e; x += step) {
      arr.push(new THREE.Vector3(x, 0, -e), new THREE.Vector3(x, 0, e));
      arr.push(new THREE.Vector3(-e, 0, x), new THREE.Vector3(e, 0, x));
    }
    return arr;
  }, [extent]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    tufts.forEach((p, i) => {
      dummy.position.set(p.x, 0.35, p.z);
      dummy.rotation.set(0, i * 0.9, 0);
      dummy.scale.set(0.5, 0.7 + (i % 3) * 0.15, 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [tufts, dummy]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(1, 0, Math.min(1, scanRef.current * 1.4));
      matRef.current.transparent = scanRef.current > 0.001;
    }
    // Hide when faded so grass shadows don't intrude on the QR edges.
    if (mesh) mesh.visible = scanRef.current < 0.9;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, tufts.length]} castShadow>
      <coneGeometry args={[0.4, 1, 4]} />
      <meshStandardMaterial ref={matRef} color={color} roughness={0.9} flatShading />
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
  const isoPos = useMemo(() => new THREE.Vector3(1, 0.82, 1).normalize().multiplyScalar(extent * 4), [extent]);
  const topPos = useMemo(() => new THREE.Vector3(0.0001, 1, 0.0001).normalize().multiplyScalar(extent * 4), [extent]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    // Ease scan value toward target.
    const goal = scanning ? 1 : 0;
    const k = 1 - Math.pow(0.0015, delta); // smooth, framerate-independent
    scanRef.current = THREE.MathUtils.lerp(scanRef.current, goal, k);
    if (Math.abs(scanRef.current - goal) < 0.001) scanRef.current = goal;

    const s = scanRef.current;
    target.copy(isoPos).lerp(topPos, s);
    camera.position.copy(target);
    camera.up.set(0, s > 0.5 ? 0 : 1, s > 0.5 ? -1 : 0);
    // Aim above the ground in the isometric view so the tall tree is centred;
    // drop to the ground plane as it flattens.
    lookTarget.set(0, THREE.MathUtils.lerp(extent * 0.72, 0, s), 0);
    camera.lookAt(lookTarget);

    // r3f's orthographic frustum is in PIXELS; drive zoom from canvas size so
    // the scene fills the frame. The isometric view needs extra vertical
    // headroom for the tall tree; the flat view zooms toward the ground square.
    const px = Math.min(size.width, size.height);
    const isoZoom = px / (extent * 2 * 2.35);
    const flatZoom = px / (extent * 2 * 1.18);
    const targetZoom = THREE.MathUtils.lerp(isoZoom, flatZoom, s);
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
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[extent * 1.5, extent * 3, extent * 1.2]}
        intensity={1.15}
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
          <meshStandardMaterial color={'#f6f1e6'} roughness={0.95} />
        </mesh>
        <QrGround matrix={matrix} palette={palette} scanRef={scanRef} tile={TILE} />
        <GrassBorder extent={extent} color={palette.grass} scanRef={scanRef} />
        <LowPolyTree palette={palette} scanRef={scanRef} seed={seed} height={matrix.size * 0.72} />
      </group>
      <Rig scanning={scanning} scanRef={scanRef} extent={extent} onReady={onReady} />
    </Canvas>
  );
}
