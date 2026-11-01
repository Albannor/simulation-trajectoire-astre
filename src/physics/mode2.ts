/**
 * Mode 2 — deux corps de masses réglables (§ 5.5). L'orbite relative est traitée avec exactement
 * les fonctions du mode 1 (kepler.ts), avec μ_rel = G·M.
 */

import { R_COLLISION, R_SORTIE } from '../config';
import { G } from './constants';
import { type ResultatImage, avancerImage } from './integrator';
import { type BodyState, distanceMinEstimee } from './kepler';
import { type SystemeNCorps, creerSysteme, etatCorps } from './nbody';
import { type Vec2, add, norm, scale, sub } from './vec2';

export interface CorpsMode2 {
  /** Masse (× Soleil). */
  readonly masse: number;
  readonly r: Vec2;
  readonly v: Vec2;
}

export interface ReglagesMode2 {
  readonly a: CorpsMode2;
  readonly b: CorpsMode2;
}

export interface GrandeursMode2 {
  /** M = mA + mB. */
  readonly masseTotale: number;
  /** Centre de masse G_cm et sa vitesse V_cm. */
  readonly gCm: Vec2;
  readonly vCm: Vec2;
  /** État relatif : r⃗_rel = r⃗B − r⃗A, v⃗_rel = v⃗B − v⃗A. */
  readonly relatif: BodyState;
  /** μ_rel = G·M. */
  readonly mu: number;
}

export function grandeursMode2(a: CorpsMode2, b: CorpsMode2): GrandeursMode2 {
  const m = a.masse + b.masse;
  return {
    masseTotale: m,
    gCm: scale(add(scale(a.r, a.masse), scale(b.r, b.masse)), 1 / m),
    vCm: scale(add(scale(a.v, a.masse), scale(b.v, b.masse)), 1 / m),
    relatif: { r: sub(b.r, a.r), v: sub(b.v, a.v) },
    mu: G * m,
  };
}

/**
 * Réglages à partir de l'état relatif (§ 5.5) : barycentre à l'origine, vitesse totale nulle.
 * r⃗A = −(mB/M)·r⃗_rel, r⃗B = (mA/M)·r⃗_rel, et de même pour les vitesses.
 */
export function reglagesDepuisRelatif(mA: number, mB: number, rel: BodyState): ReglagesMode2 {
  const m = mA + mB;
  return {
    a: { masse: mA, r: scale(rel.r, -mB / m), v: scale(rel.v, -mB / m) },
    b: { masse: mB, r: scale(rel.r, mA / m), v: scale(rel.v, mA / m) },
  };
}

/** « Annuler la dérive » (§ 11 point 4) : retranche V_cm aux deux vitesses. */
export function annulerDerive(reg: ReglagesMode2): ReglagesMode2 {
  const { vCm } = grandeursMode2(reg.a, reg.b);
  return {
    a: { ...reg.a, v: sub(reg.a.v, vCm) },
    b: { ...reg.b, v: sub(reg.b.v, vCm) },
  };
}

export const CORPS_A = 0;
export const CORPS_B = 1;

export function creerSystemeMode2(reg: ReglagesMode2): SystemeNCorps {
  return creerSysteme([reg.a, reg.b]);
}

/** Corps A et B du système (positions, vitesses et masses courantes). */
export function corpsDuSysteme(s: SystemeNCorps): ReglagesMode2 {
  const a = etatCorps(s, CORPS_A);
  const b = etatCorps(s, CORPS_B);
  return {
    a: { masse: s.masses[CORPS_A] ?? 0, ...a },
    b: { masse: s.masses[CORPS_B] ?? 0, ...b },
  };
}

export type FinMode2 = 'contact' | 'separation';

/**
 * Fin de simulation (§ 5.7) : d < R_COLLISION → contact ; d > R_SORTIE avec ε_rel ≥ 0 → séparation.
 * `energieRelative` est l'énergie relative initiale (analytique, conservée).
 */
export function finMode2(rel: BodyState, energieRelative: number): FinMode2 | null {
  const d = norm(rel.r);
  if (d < R_COLLISION) return 'contact';
  if (d > R_SORTIE && energieRelative >= 0) return 'separation';
  return null;
}

/** Avance le mode 2 d'une image : pas adaptatif sur l'orbite relative (D-13), arrêt au sous-pas. */
export function avancerMode2(
  s: SystemeNCorps,
  dureeImage: number,
  energieRelative: number,
  surSousPas?: (s: Readonly<SystemeNCorps>) => void,
): ResultatImage<FinMode2> {
  const { a, b } = corpsDuSysteme(s);
  const g = grandeursMode2(a, b);
  const dMin = distanceMinEstimee(g.relatif, g.mu);
  return avancerImage(
    s,
    dureeImage,
    dMin,
    g.mu,
    (sys) => {
      const c = corpsDuSysteme(sys);
      return finMode2({ r: sub(c.b.r, c.a.r), v: sub(c.b.v, c.a.v) }, energieRelative);
    },
    surSousPas,
  );
}

/** Rapport de masses pour l'affichage « A = 2 × B » : le plus lourd et le facteur (≥ 1). */
export function rapportMasses(
  mA: number,
  mB: number,
): { readonly plusLourd: 'A' | 'B' | null; readonly facteur: number } {
  if (mA === mB) return { plusLourd: null, facteur: 1 };
  return mA > mB ? { plusLourd: 'A', facteur: mA / mB } : { plusLourd: 'B', facteur: mB / mA };
}
