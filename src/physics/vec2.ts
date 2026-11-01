/** Vecteur du plan (x vers la droite, y vers le haut — repère interne, § 4.2). */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(a: Vec2, k: number): Vec2 {
  return { x: a.x * k, y: a.y * k };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/** Composante z du produit vectoriel a × b (positif si b est à gauche de a, sens anti-horaire). */
export function cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

export function norm(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}

/** Vecteur unitaire d'angle polaire `angle` (radians). */
export function polar(angle: number, longueur = 1): Vec2 {
  return { x: longueur * Math.cos(angle), y: longueur * Math.sin(angle) };
}
