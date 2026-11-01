/**
 * Problème à deux corps : éléments de l'orbite, classification analytique, conique prévue,
 * construction d'un état à partir d'éléments (spécifications § 5.2 à § 5.4).
 * Toutes les fonctions sont pures. Unités : UA, an, UA/an ; μ en UA³/an².
 */

import {
  E_DIRECTION_INDEFINIE,
  E_PARABOLE_EXACTE,
  H_RADIAL,
  JAUGE_SEGMENTS,
  N_POINTS_CONIQUE,
  R_COLLISION,
  TOL_CERCLE,
  TOL_PARABOLE,
} from '../config';
import { MU_SOLEIL } from './constants';
import { type Vec2, add, cross, dot, norm, polar, scale } from './vec2';

/** Position et vitesse d'un corps. */
export interface BodyState {
  readonly r: Vec2;
  readonly v: Vec2;
}

/** Sens de rotation : +1 anti-horaire, −1 horaire. */
export type Sens = 1 | -1;

/** Forme d'une trajectoire non radiale (§ 5.3). */
export type ShapeClass = 'cercle' | 'ellipse' | 'parabole' | 'hyperbole';

/** Éléments d'une orbite képlérienne plane. Les grandeurs sans objet valent `null`. */
export interface OrbitElements {
  /** Paramètre gravitationnel utilisé (UA³/an²). */
  readonly mu: number;
  /** Énergie par unité de masse ε = v²/2 − μ/r (UA²/an²). */
  readonly energie: number;
  /** Moment cinétique par unité de masse, signé (UA²/an). */
  readonly h: number;
  /** Sens de parcours (signe de h ; +1 si h = 0). */
  readonly sens: Sens;
  /** Paramètre de la conique p = h²/μ (UA). */
  readonly p: number;
  /** Excentricité. */
  readonly e: number;
  /** Direction du périhélie ω (rad), angle polaire du vecteur de Laplace–Runge–Lenz. */
  readonly omega: number;
  /** Demi-grand axe a = −μ/(2ε) (UA) : négatif pour une hyperbole, ±∞ si ε = 0. */
  readonly a: number;
  /** Distance au périhélie rp = p/(1+e) (UA). */
  readonly rp: number;
  /** Distance à l'aphélie (UA), si e < 1. */
  readonly ra: number | null;
  /** Demi-petit axe (UA), si ε < 0. */
  readonly b: number | null;
  /** Distance centre–foyer c = a·e (UA), si ε < 0. */
  readonly c: number | null;
  /** Période (an), si ε < 0. */
  readonly periode: number | null;
  /** Vitesse à l'infini v∞ = √(2ε) (UA/an), si ε > 0. */
  readonly vInfini: number | null;
  /** Angle de déviation δ = 2·asin(1/e) (rad), si e > 1. */
  readonly deviation: number | null;
  /** Anomalie vraie des asymptotes ν∞ = acos(−1/e) (rad), si e ≥ 1. */
  readonly nuInfini: number | null;
}

/** Résultat de la classification analytique (§ 5.3 ; décisions D-01, D-02, D-04). */
export type Classification =
  | {
      readonly type: 'droite';
      /** D-01 : tombe (va vers le Soleil), retombe (monte puis retombe), part (s'échappe). */
      readonly issue: 'tombe' | 'retombe' | 'part';
      readonly collision: boolean;
    }
  | {
      readonly type: 'conique';
      readonly forme: ShapeClass;
      /** Parabole « presque » : |e − 1| ≥ E_PARABOLE_EXACTE (D-04). */
      readonly presque: boolean;
      /** Collision annoncée (D-02). */
      readonly collision: boolean;
    };

/** Calcule les éléments de l'orbite de l'état (r, v) autour d'un centre de paramètre μ (§ 5.2). */
export function elements(etat: BodyState, mu: number = MU_SOLEIL): OrbitElements {
  const { r, v } = etat;
  const dist = norm(r);
  const v2 = dot(v, v);
  const energie = v2 / 2 - mu / dist;
  const h = cross(r, v);
  const sens: Sens = h < 0 ? -1 : 1;
  const p = (h * h) / mu;
  // Vecteur de Laplace–Runge–Lenz : e⃗ = ((v² − μ/r)·r⃗ − (r⃗·v⃗)·v⃗)/μ.
  const eVec = scale(add(scale(r, v2 - mu / dist), scale(v, -dot(r, v))), 1 / mu);
  // e = |e⃗|, mathématiquement égal à √(1 + 2εh²/μ²) (§ 5.2) mais sans la compensation
  // catastrophique de cette formule près du cercle : pour la Terre, elle donne e ≈ 1e-8 au lieu
  // de ~1e-16 (T-01 exige e < 1e-9). Décision D-16.
  const e = norm(eVec);
  // D-14 : pour un cercle, direction indéfinie → direction du point de départ.
  const omega =
    norm(eVec) > E_DIRECTION_INDEFINIE ? Math.atan2(eVec.y, eVec.x) : Math.atan2(r.y, r.x);

  const a = energie === 0 ? Infinity : -mu / (2 * energie);
  const rp = p / (1 + e);
  const lie = energie < 0;

  return {
    mu,
    energie,
    h,
    sens,
    p,
    e,
    omega,
    a,
    rp,
    ra: e < 1 ? p / (1 - e) : null,
    b: lie ? a * Math.sqrt(Math.max(0, 1 - e * e)) : null,
    c: lie ? a * e : null,
    periode: lie ? 2 * Math.PI * Math.sqrt(a ** 3 / mu) : null,
    vInfini: energie > 0 ? Math.sqrt(2 * energie) : null,
    deviation: e > 1 ? 2 * Math.asin(1 / e) : null,
    nuInfini: e >= 1 ? Math.acos(-1 / e) : null,
  };
}

/**
 * Classification analytique à partir des conditions initiales, jamais déduite de la simulation (§ 5.3).
 * - |h| < H_RADIAL : trajectoire droite (D-01).
 * - Sinon, cercle si e < TOL_CERCLE, parabole si v ≈ v_lib (D-17), ellipse ou hyperbole selon ε ; collision annoncée si le périhélie est sous R_COLLISION **et** qu'il
 *   sera atteint : toujours pour une orbite liée, seulement à l'approche (r⃗·v⃗ < 0) sinon (D-02).
 */
export function classifier(etat: BodyState, mu: number = MU_SOLEIL): Classification {
  const el = elements(etat, mu);
  const approche = dot(etat.r, etat.v) < 0;

  if (Math.abs(el.h) < H_RADIAL) {
    // v⃗ ∥ r⃗ : r⃗·v⃗ ≤ 0 couvre aussi v = 0 (chute libre depuis le repos).
    if (dot(etat.r, etat.v) <= 0) return { type: 'droite', issue: 'tombe', collision: true };
    if (el.energie < 0) return { type: 'droite', issue: 'retombe', collision: true };
    return { type: 'droite', issue: 'part', collision: false };
  }

  const collision = el.rp < R_COLLISION && (el.energie < 0 || approche);
  // D-17 : la bande « parabole » est définie par l'énergie (v ≈ v_lib), et non par |e − 1| seul :
  // e → 1 aussi pour une chute lente (ellipse aplatie) ou un départ quasi radial très rapide
  // (hyperbole). |v²/v_lib² − 1| ≤ TOL_PARABOLE/2 coïncide avec |e − 1| ≤ TOL_PARABOLE à θ = 90°
  // et implique |e − 1| ≤ TOL_PARABOLE pour tout θ.
  const ecartLiberation = Math.abs((dot(etat.v, etat.v) * norm(etat.r)) / (2 * mu) - 1);
  let forme: ShapeClass;
  if (el.e < TOL_CERCLE) forme = 'cercle';
  else if (ecartLiberation <= TOL_PARABOLE / 2) forme = 'parabole';
  else if (el.energie < 0) forme = 'ellipse';
  else forme = 'hyperbole';

  return {
    type: 'conique',
    forme,
    presque: forme === 'parabole' && Math.abs(el.e - 1) >= E_PARABOLE_EXACTE,
    collision,
  };
}

/** Vitesse circulaire à la distance r : √(μ/r) (= 2π/√r autour du Soleil). */
export function vCirc(r: number, mu: number = MU_SOLEIL): number {
  return Math.sqrt(mu / r);
}

/** Vitesse de libération à la distance r : √2 · v_circ. */
export function vLib(r: number, mu: number = MU_SOLEIL): number {
  return Math.SQRT2 * vCirc(r, mu);
}

/** Distance au foyer pour l'anomalie vraie ν : r(ν) = p / (1 + e·cos ν). */
export function rayonConique(p: number, e: number, nu: number): number {
  return p / (1 + e * Math.cos(nu));
}

/** Point de la conique d'anomalie vraie ν (mesurée depuis le périhélie dans le sens de parcours). */
export function pointConique(el: OrbitElements, nu: number): Vec2 {
  return polar(el.omega + el.sens * nu, rayonConique(el.p, el.e, nu));
}

/** Anomalie vraie (rad, dans ]−π, π]) d'une position r⃗ sur l'orbite `el`. */
export function anomalieVraie(el: OrbitElements, r: Vec2): number {
  const brut = el.sens * (Math.atan2(r.y, r.x) - el.omega);
  return Math.atan2(Math.sin(brut), Math.cos(brut));
}

/** Trajectoire prévue échantillonnée (§ 5.4). */
export interface ConiqueEchantillonnee {
  /** Coordonnées entrelacées x0, y0, x1, y1… (UA). */
  readonly points: Float64Array;
  /** Courbe fermée (ellipse entière). */
  readonly fermee: boolean;
  /** Anomalie vraie limite |ν| ≤ nuMax (rad). */
  readonly nuMax: number;
}

/**
 * Échantillonne la conique sur ~N_POINTS_CONIQUE points (§ 5.4).
 * Ellipse entière si e < 1 et que l'aphélie est visible (ra ≤ rVue) ; sinon |ν| < ν_lim avec
 * ν_lim = acos((p/rVue − 1)/e), argument borné à [−1, 1] (si rVue < rp, seul le périhélie est visible).
 * Pour une orbite ouverte, ν_lim < ν∞ automatiquement puisque p/rVue > 0.
 */
export function echantillonnerConique(
  el: OrbitElements,
  rVue: number,
  n: number = N_POINTS_CONIQUE,
): ConiqueEchantillonnee {
  const fermee = el.e < 1 && el.ra !== null && el.ra <= rVue;
  let nuMax = Math.PI;
  if (!fermee) {
    const arg = el.e === 0 ? 1 : (el.p / rVue - 1) / el.e;
    nuMax = Math.acos(Math.min(1, Math.max(-1, arg)));
  }
  const points = new Float64Array(2 * (n + 1));
  for (let k = 0; k <= n; k++) {
    const nu = -nuMax + (2 * nuMax * k) / n;
    const pt = pointConique(el, nu);
    points[2 * k] = pt.x;
    points[2 * k + 1] = pt.y;
  }
  return { points, fermee, nuMax };
}

/** Éléments d'entrée pour construire un état (préréglages, § 5.2). */
export interface ElementsDepart {
  /** Paramètre de la conique p (UA). */
  readonly p: number;
  readonly e: number;
  /** Anomalie vraie de départ ν (rad). */
  readonly nu: number;
  /** Direction du périhélie ω (rad). */
  readonly omega: number;
  readonly sens: Sens;
}

/** Paramètre p d'une conique à partir de sa distance au périhélie : p = rp·(1 + e). */
export function parametreDepuisPeriapse(rp: number, e: number): number {
  return rp * (1 + e);
}

/**
 * État (r⃗, v⃗) à partir d'éléments (§ 5.2) :
 * r = p/(1 + e cos ν), v_r = √(μ/p)·e·sin ν, v_t = √(μ/p)·(1 + e cos ν).
 */
export function etatDepuisElements(d: ElementsDepart, mu: number = MU_SOLEIL): BodyState {
  const r = rayonConique(d.p, d.e, d.nu);
  const angle = d.omega + d.sens * d.nu;
  const k = Math.sqrt(mu / d.p);
  const vr = k * d.e * Math.sin(d.nu);
  const vt = k * (1 + d.e * Math.cos(d.nu));
  const rHat = polar(angle);
  const phiHat = polar(angle + Math.PI / 2);
  return {
    r: scale(rHat, r),
    v: add(scale(rHat, vr), scale(phiHat, d.sens * vt)),
  };
}

/**
 * Second foyer (UA), le Soleil étant le premier à l'origine : F' = −2·a·e·ω̂ (ellipse : du côté de
 * l'aphélie ; hyperbole, a < 0 : au-delà du périhélie). `null` si a est infini (parabole).
 */
export function foyerVide(el: OrbitElements): Vec2 | null {
  if (!Number.isFinite(el.a)) return null;
  return polar(el.omega, -2 * el.a * el.e);
}

/**
 * Asymptotes d'une hyperbole : droites passant par le centre C = −a·e·ω̂ (à |a|·e du Soleil, au-delà
 * du périhélie), de directions ω ± ν∞. `null` si e ≤ 1 ou si a est infini.
 */
export function asymptotes(
  el: OrbitElements,
): { readonly centre: Vec2; readonly directions: readonly [number, number] } | null {
  if (el.e <= 1 || el.nuInfini === null || !Number.isFinite(el.a)) return null;
  return {
    centre: polar(el.omega, -el.a * el.e),
    directions: [el.omega + el.nuInfini, el.omega - el.nuInfini],
  };
}

/** Aire balayée par le rayon Soleil–astre pendant Δt (2ᵉ loi de Kepler) : |h|·Δt/2 (UA²). */
export function aireBalayee(h: number, dt: number): number {
  return (Math.abs(h) * dt) / 2;
}

/**
 * Durée d'un secteur de la loi des aires (F-M1-8) : T/n pour une orbite liée, rp^(3/2)/n sinon
 * (temps caractéristique au périhélie, en an avec rp en UA). `null` pour une trajectoire droite.
 */
export function dureeSecteur(el: OrbitElements, cl: Classification, n: number): number | null {
  if (cl.type === 'droite') return null;
  // Forme et non signe de ε : une « parabole » (D-17) légèrement liée a une période immense.
  const fermee = cl.forme === 'cercle' || cl.forme === 'ellipse';
  return fermee && el.periode !== null ? el.periode / n : el.rp ** 1.5 / n;
}

/**
 * Distance maximale atteinte sur une trajectoire droite liée (ε < 0) : r_max = −μ/ε.
 * `Infinity` si ε ≥ 0 (l'astre s'éloigne indéfiniment).
 */
export function rayonMaxRadial(etat: BodyState, mu: number = MU_SOLEIL): number {
  const energie = dot(etat.v, etat.v) / 2 - mu / norm(etat.r);
  return energie < 0 ? -mu / energie : Infinity;
}

/**
 * Distance minimale à retenir pour le pas adaptatif d'une image (§ 5.7, décision D-13) :
 * à l'approche, le périhélie peut être franchi pendant l'image → min(r, rp) ; sinon r.
 * Bornée inférieurement par R_COLLISION (la simulation s'arrête de toute façon en deçà).
 */
export function distanceMinEstimee(etat: BodyState, mu: number = MU_SOLEIL): number {
  const r = norm(etat.r);
  const d = dot(etat.r, etat.v) < 0 ? Math.min(r, elements(etat, mu).rp) : r;
  return Math.max(R_COLLISION, d);
}

/**
 * Position du repère sur la jauge de forme, en fraction de 0 à 1 (§ 5.3).
 * `null` pour une trajectoire droite (pas de conique).
 */
export function positionJauge(cl: Classification, e: number): number | null {
  if (cl.type === 'droite') return null;
  const { cercle, ellipse, parabole, hyperbole } = JAUGE_SEGMENTS;
  switch (cl.forme) {
    case 'cercle':
      return cercle / 2;
    case 'ellipse':
      return cercle + e * ellipse;
    case 'parabole':
      return cercle + ellipse + parabole / 2;
    case 'hyperbole':
      return cercle + ellipse + parabole + Math.min((e - 1) / 2, 1) * hyperbole;
  }
}
