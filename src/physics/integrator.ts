/**
 * Intégration numérique (§ 5.7) : schéma saute-mouton « kick-drift-kick » (vitesse-Verlet),
 * pas adaptatif choisi une fois par image et constant à l'intérieur de l'image.
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion --
   Boucle chaude : indices bornés par `s.n` (voir nbody.ts). */

import { ETA, MAX_SOUS_PAS } from '../config';
import { type SystemeNCorps, calculerAccelerations, copierSysteme } from './nbody';

export interface ChoixPas {
  /** Pas d'intégration (an). */
  readonly dt: number;
  /** Nombre de sous-pas de l'image. */
  readonly sousPas: number;
  /** Durée réellement simulée (an) : inférieure à la durée demandée si le plafond est atteint. */
  readonly dureeEffective: number;
  /** Plafond MAX_SOUS_PAS atteint : afficher « simulation ralentie ». */
  readonly ralenti: boolean;
}

/**
 * dt_max = η·√(d_min³ / (G·M_tot)) ; sous-pas = ⌈Δt_image / dt_max⌉ plafonné à `maxSousPas`.
 * Au plafond, on garde dt = dt_max (la précision prime) et la vitesse effective est réduite.
 */
export function choisirPas(
  dureeImage: number,
  dMin: number,
  gMasseTotale: number,
  eta: number = ETA,
  maxSousPas: number = MAX_SOUS_PAS,
): ChoixPas {
  const dtMax = eta * Math.sqrt(dMin ** 3 / gMasseTotale);
  const besoin = Math.max(1, Math.ceil(dureeImage / dtMax));
  if (besoin > maxSousPas) {
    return { dt: dtMax, sousPas: maxSousPas, dureeEffective: dtMax * maxSousPas, ralenti: true };
  }
  return { dt: dureeImage / besoin, sousPas: besoin, dureeEffective: dureeImage, ralenti: false };
}

/** Un pas saute-mouton KDK. Suppose `s.acc` à jour ; le laisse à jour. Modifie `s`. */
export function pasSauteMouton(s: SystemeNCorps, dt: number): void {
  const { n, fixes, pos, vel, acc } = s;
  const demi = dt / 2;
  for (let i = 0; i < n; i++) {
    if (fixes[i]) continue;
    for (let k = 2 * i; k < 2 * i + 2; k++) {
      vel[k] = vel[k]! + demi * acc[k]!;
      pos[k] = pos[k]! + dt * vel[k]!;
    }
  }
  calculerAccelerations(s);
  for (let i = 0; i < n; i++) {
    if (fixes[i]) continue;
    for (let k = 2 * i; k < 2 * i + 2; k++) vel[k] = vel[k]! + demi * acc[k]!;
  }
  s.t += dt;
}

export interface ResultatImage<E> {
  /** Nouveau système (le système d'entrée n'est pas modifié). */
  readonly systeme: SystemeNCorps;
  readonly sousPas: number;
  readonly dureeEffective: number;
  readonly ralenti: boolean;
  /** Événement de fin (collision, sortie…) détecté à un sous-pas, sinon `null` (D-15). */
  readonly evenement: E | null;
}

/**
 * Avance le système d'une image de durée `dureeImage` (an). `arret` est évalué après chaque
 * sous-pas ; s'il renvoie un événement, l'intégration s'arrête immédiatement (D-15).
 */
export function avancerImage<E>(
  systeme: SystemeNCorps,
  dureeImage: number,
  dMin: number,
  gMasseTotale: number,
  arret?: (s: SystemeNCorps) => E | null,
): ResultatImage<E> {
  const s = copierSysteme(systeme);
  const choix = choisirPas(dureeImage, dMin, gMasseTotale);
  const t0 = s.t;
  let evenement: E | null = null;
  let k = 0;
  while (k < choix.sousPas) {
    pasSauteMouton(s, choix.dt);
    k++;
    evenement = arret ? arret(s) : null;
    if (evenement !== null) break;
  }
  return {
    systeme: s,
    sousPas: k,
    dureeEffective: s.t - t0,
    ralenti: choix.ralenti,
    evenement,
  };
}
