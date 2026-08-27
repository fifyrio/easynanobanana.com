import * as THREE from 'three';

/**
 * Procedural white-on-transparent alpha textures for instanced foliage.
 * White fill lets per-instance colours tint via instanceColor.
 */

let leafTex: THREE.CanvasTexture | null = null;
let bladeTex: THREE.CanvasTexture | null = null;
let wingTex: THREE.CanvasTexture | null = null;

/** A pointed-oval leaf silhouette. */
export function getLeafTexture(): THREE.CanvasTexture {
  if (leafTex) return leafTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.translate(32, 32);
  g.beginPath();
  g.moveTo(0, -27);
  g.quadraticCurveTo(17, -10, 12, 10);
  g.quadraticCurveTo(6, 24, 0, 27);
  g.quadraticCurveTo(-6, 24, -12, 10);
  g.quadraticCurveTo(-17, -10, 0, -27);
  g.fill();
  leafTex = new THREE.CanvasTexture(c);
  return leafTex;
}

/**
 * A butterfly wing silhouette: two rounded lobes (large forewing above,
 * smaller hindwing below), hinge on the LEFT edge of the canvas. Mirror with
 * scale.x = -1 for the opposite wing.
 */
export function getWingTexture(): THREE.CanvasTexture {
  if (wingTex) return wingTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  // Forewing: big upper lobe from the hinge.
  g.beginPath();
  g.moveTo(4, 34);
  g.bezierCurveTo(6, 8, 40, 0, 56, 10);
  g.bezierCurveTo(62, 16, 54, 32, 30, 36);
  g.closePath();
  g.fill();
  // Hindwing: smaller lower lobe.
  g.beginPath();
  g.moveTo(4, 36);
  g.bezierCurveTo(26, 34, 44, 40, 46, 50);
  g.bezierCurveTo(44, 60, 20, 62, 8, 50);
  g.closePath();
  g.fill();
  wingTex = new THREE.CanvasTexture(c);
  return wingTex;
}

/** A thin tapered grass blade silhouette (base at bottom). */
export function getBladeTexture(): THREE.CanvasTexture {
  if (bladeTex) return bladeTex;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(10, 64);
  g.quadraticCurveTo(6, 30, 18, 2); // curved tip
  g.quadraticCurveTo(20, 30, 22, 64);
  g.closePath();
  g.fill();
  bladeTex = new THREE.CanvasTexture(c);
  return bladeTex;
}
