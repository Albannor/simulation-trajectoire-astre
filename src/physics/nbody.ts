/**
 * Système N corps générique (§ 8.3) : utilisé avec N = 2. Le mode 1 est le cas « corps fixe de
 * masse 1 (Soleil) + corps d'épreuve de masse nulle ».
 *
 * Les tableaux sont des Float64Array entrelacés (x0, y0, x1, y1…) pour la boucle d'intégration,
 * qui effectue jusqu'à MAX_SOUS_PAS pas par image. Les fonctions exportées ne modifient jamais
 * le système reçu, à l'exception de `calculerAccelerations` (usage interne de l'intégrateur,
 * appliqué à une copie).
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion --
   Boucle chaude : les indices sont bornés par `n`, fixé à la création du système et cohérent
   avec la taille des tableaux ; `noUncheckedIndexedAccess` ne peut pas le prouver. */

import { G } from './constants';
import type { BodyState } from './kepler';
import type { Vec2 } from './vec2';

export interface CorpsInitial {
  /** Masse (× Soleil) ; 0 pour un corps d'épreuve. */
  readonly masse: number;
  readonly r: Vec2;
  readonly v: Vec2;
  /** Corps immobile (le Soleil du mode 1). */
  readonly fixe?: boolean;
}

export interface SystemeNCorps {
  readonly n: number;
  /** Constante gravitationnelle (UA³·an⁻²·M☉⁻¹). */
  readonly g: number;
  readonly masses: Float64Array;
  readonly fixes: Uint8Array;
  readonly pos: Float64Array;
  readonly vel: Float64Array;
  /** Accélérations à la position courante (toujours à jour). */
  readonly acc: Float64Array;
  /** Temps écoulé (an). */
  t: number;
}

export function creerSysteme(corps: readonly CorpsInitial[], g: number = G): SystemeNCorps {
  const n = corps.length;
  const s: SystemeNCorps = {
    n,
    g,
    masses: new Float64Array(n),
    fixes: new Uint8Array(n),
    pos: new Float64Array(2 * n),
    vel: new Float64Array(2 * n),
    acc: new Float64Array(2 * n),
    t: 0,
  };
  corps.forEach((c, i) => {
    s.masses[i] = c.masse;
    s.fixes[i] = c.fixe ? 1 : 0;
    s.pos[2 * i] = c.r.x;
    s.pos[2 * i + 1] = c.r.y;
    s.vel[2 * i] = c.fixe ? 0 : c.v.x;
    s.vel[2 * i + 1] = c.fixe ? 0 : c.v.y;
  });
  calculerAccelerations(s);
  return s;
}

export function copierSysteme(s: SystemeNCorps): SystemeNCorps {
  return {
    n: s.n,
    g: s.g,
    masses: s.masses.slice(),
    fixes: s.fixes.slice(),
    pos: s.pos.slice(),
    vel: s.vel.slice(),
    acc: s.acc.slice(),
    t: s.t,
  };
}

/** Met à jour `s.acc` : a⃗ᵢ = −Σⱼ G·mⱼ·(r⃗ᵢ − r⃗ⱼ)/|r⃗ᵢ − r⃗ⱼ|³ (§ 5.5). Modifie `s`. */
export function calculerAccelerations(s: SystemeNCorps): void {
  const { n, g, masses, fixes, pos, acc } = s;
  for (let i = 0; i < n; i++) {
    let ax = 0;
    let ay = 0;
    if (!fixes[i]) {
      const xi = pos[2 * i]!;
      const yi = pos[2 * i + 1]!;
      for (let j = 0; j < n; j++) {
        const mj = masses[j]!;
        if (j === i || mj === 0) continue;
        const dx = xi - pos[2 * j]!;
        const dy = yi - pos[2 * j + 1]!;
        const d2 = dx * dx + dy * dy;
        const k = (g * mj) / (d2 * Math.sqrt(d2));
        ax -= k * dx;
        ay -= k * dy;
      }
    }
    acc[2 * i] = ax;
    acc[2 * i + 1] = ay;
  }
}

/** Position et vitesse du corps i. */
export function etatCorps(s: SystemeNCorps, i: number): BodyState {
  return {
    r: { x: s.pos[2 * i]!, y: s.pos[2 * i + 1]! },
    v: { x: s.vel[2 * i]!, y: s.vel[2 * i + 1]! },
  };
}

/** Distance entre les corps i et j (UA). */
export function distanceCorps(s: SystemeNCorps, i: number, j: number): number {
  return Math.hypot(s.pos[2 * i]! - s.pos[2 * j]!, s.pos[2 * i + 1]! - s.pos[2 * j + 1]!);
}

/** Centre de masse : position G_cm, vitesse V_cm et masse totale M (§ 5.5). */
export function barycentre(s: SystemeNCorps): BodyState & { readonly masse: number } {
  let m = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  for (let i = 0; i < s.n; i++) {
    const mi = s.masses[i]!;
    m += mi;
    x += mi * s.pos[2 * i]!;
    y += mi * s.pos[2 * i + 1]!;
    vx += mi * s.vel[2 * i]!;
    vy += mi * s.vel[2 * i + 1]!;
  }
  return { masse: m, r: { x: x / m, y: y / m }, v: { x: vx / m, y: vy / m } };
}

/** Énergie mécanique totale Σ ½mᵢvᵢ² − Σᵢ<ⱼ G·mᵢ·mⱼ/rᵢⱼ (M☉·UA²/an²). */
export function energieTotale(s: SystemeNCorps): number {
  let e = 0;
  for (let i = 0; i < s.n; i++) {
    const mi = s.masses[i]!;
    const vx = s.vel[2 * i]!;
    const vy = s.vel[2 * i + 1]!;
    e += 0.5 * mi * (vx * vx + vy * vy);
    for (let j = i + 1; j < s.n; j++) {
      e -= (s.g * mi * s.masses[j]!) / distanceCorps(s, i, j);
    }
  }
  return e;
}
