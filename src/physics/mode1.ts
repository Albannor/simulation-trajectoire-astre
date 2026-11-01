/**
 * Mode 1 — un astre de masse négligeable autour du Soleil fixe (§ 5.1, § 5.7).
 */

import { R_COLLISION, R_SORTIE } from '../config';
import { MU_SOLEIL } from './constants';
import { type ResultatImage, avancerImage } from './integrator';
import { type BodyState, type Sens, distanceMinEstimee } from './kepler';
import { type SystemeNCorps, creerSysteme, etatCorps } from './nbody';
import { add, cross, dot, norm, polar, scale } from './vec2';

/** Réglages du lancer (angles en radians). */
export interface ReglagesMode1 {
  /** Distance au Soleil (UA). */
  readonly r0: number;
  /** Vitesse de départ (UA/an). */
  readonly v0: number;
  /** Direction θ : angle entre la vitesse et la direction radiale sortante, dans [0, π] (rad). */
  readonly theta: number;
  /** Sens de rotation. */
  readonly sens: Sens;
  /** Angle polaire de la position de départ (rad) — sans effet physique. */
  readonly phi0: number;
}

/** v⃗₀ = v₀ (cos θ · r̂ + s · sin θ · φ̂) (§ 5.1). */
export function etatInitialMode1(reg: ReglagesMode1): BodyState {
  const rHat = polar(reg.phi0);
  const phiHat = polar(reg.phi0 + Math.PI / 2);
  return {
    r: scale(rHat, reg.r0),
    v: scale(
      add(scale(rHat, Math.cos(reg.theta)), scale(phiHat, reg.sens * Math.sin(reg.theta))),
      reg.v0,
    ),
  };
}

/** Réglages correspondant à un état (inverse de `etatInitialMode1`). */
export function reglagesDepuisEtat(etat: BodyState): ReglagesMode1 {
  const r0 = norm(etat.r);
  const rHat = scale(etat.r, 1 / r0);
  const vr = dot(etat.v, rHat);
  const vt = cross(rHat, etat.v);
  return {
    r0,
    v0: norm(etat.v),
    theta: Math.atan2(Math.abs(vt), vr),
    sens: vt < 0 ? -1 : 1,
    phi0: Math.atan2(etat.r.y, etat.r.x),
  };
}

/** Indice des corps dans le système du mode 1. */
export const SOLEIL = 0;
export const ASTRE = 1;

/** Système N corps du mode 1 : Soleil fixe de masse 1 à l'origine + astre de masse nulle. */
export function creerSystemeMode1(etat: BodyState): SystemeNCorps {
  return creerSysteme([
    { masse: 1, r: { x: 0, y: 0 }, v: { x: 0, y: 0 }, fixe: true },
    { masse: 0, r: etat.r, v: etat.v },
  ]);
}

export function etatAstre(s: SystemeNCorps): BodyState {
  return etatCorps(s, ASTRE);
}

export type FinMode1 = 'collision' | 'sortie';

/**
 * Fin de simulation (§ 5.7) : r < R_COLLISION → collision ; r > R_SORTIE avec ε ≥ 0 → sortie.
 * `energie` est l'énergie initiale (analytique, conservée).
 */
export function finMode1(etat: BodyState, energie: number): FinMode1 | null {
  const r = norm(etat.r);
  if (r < R_COLLISION) return 'collision';
  if (r > R_SORTIE && energie >= 0) return 'sortie';
  return null;
}

/** Avance la simulation du mode 1 d'une image (pas adaptatif, D-13 ; arrêt au sous-pas, D-15). */
export function avancerMode1(
  s: SystemeNCorps,
  dureeImage: number,
  energieInitiale: number,
  surSousPas?: (s: Readonly<SystemeNCorps>) => void,
): ResultatImage<FinMode1> {
  const dMin = distanceMinEstimee(etatAstre(s), MU_SOLEIL);
  return avancerImage(
    s,
    dureeImage,
    dMin,
    MU_SOLEIL,
    (sys) => finMode1(etatAstre(sys), energieInitiale),
    surSousPas,
  );
}

/** Énergie par unité de masse ε = v²/2 − μ/r. */
export function energieSpecifique(etat: BodyState, mu: number = MU_SOLEIL): number {
  return dot(etat.v, etat.v) / 2 - mu / norm(etat.r);
}

/**
 * Écart d'énergie pour l'indicateur de précision (D-03) : |ε − ε₀| / (½v₀² + μ/r₀),
 * bien défini même pour une parabole (ε₀ ≈ 0).
 */
export function ecartEnergie(
  etat: BodyState,
  etatInitial: BodyState,
  mu: number = MU_SOLEIL,
): number {
  const e0 = energieSpecifique(etatInitial, mu);
  const echelle = dot(etatInitial.v, etatInitial.v) / 2 + mu / norm(etatInitial.r);
  return Math.abs(energieSpecifique(etat, mu) - e0) / echelle;
}

/** Mesures en direct (F-SIM-6) : distance au Soleil (UA) et vitesse (UA/an). */
export function mesuresMode1(etat: BodyState): { distance: number; vitesse: number } {
  return { distance: norm(etat.r), vitesse: norm(etat.v) };
}
