/** Outils partagés par les tests du module physique (aucune dépendance de test ici). */

import { TEMPS_X1 } from '../config';
import { type BodyState } from './kepler';
import { type FinMode1, avancerMode1, creerSystemeMode1, etatAstre } from './mode1';
import { type SystemeNCorps } from './nbody';

/** Durée d'une image à 60 images/s pour un multiplicateur de vitesse du temps (an). */
export function dureeImage(multiplicateur: number): number {
  return (TEMPS_X1 * multiplicateur) / 60;
}

export interface Observateurs {
  /** Appelé après chaque image. */
  readonly image?: (etat: BodyState, s: Readonly<SystemeNCorps>) => void;
  /** Appelé après chaque sous-pas d'intégration (mesure des maxima sans en manquer les pics). */
  readonly sousPas?: (etat: BodyState, s: Readonly<SystemeNCorps>) => void;
}

/**
 * Simule le mode 1 image par image, exactement comme l'animation (§ 5.7). S'arrête à `duree` ou
 * au premier événement de fin.
 */
export function simulerMode1(
  depart: BodyState,
  energie: number,
  duree: number,
  multiplicateur: number,
  observateurs: Observateurs = {},
): { systeme: SystemeNCorps; evenement: FinMode1 | null; sousPasMax: number } {
  let s = creerSystemeMode1(depart);
  const di = dureeImage(multiplicateur);
  const nImages = Math.round(duree / di);
  const surSousPas = observateurs.sousPas;
  let sousPasMax = 0;
  for (let k = 0; k < nImages; k++) {
    const res = avancerMode1(
      s,
      di,
      energie,
      surSousPas ? (sys) => surSousPas(etatAstre(sys), sys) : undefined,
    );
    s = res.systeme;
    sousPasMax = Math.max(sousPasMax, res.sousPas);
    observateurs.image?.(etatAstre(s), s);
    if (res.evenement) return { systeme: s, evenement: res.evenement, sousPasMax };
  }
  return { systeme: s, evenement: null, sousPasMax };
}
