/**
 * Préréglages du mode 1, définis par éléments orbitaux et convertis en état initial (§ 6.5).
 * Convention d'affichage : périhélie à droite du Soleil (ω = 0), sens anti-horaire ; la position
 * de départ φ₀ s'en déduit (sans effet physique).
 */

import { degToRad } from './constants';
import { etatDepuisElements, parametreDepuisPeriapse, type ElementsDepart } from './kepler';
import { type ReglagesMode1, reglagesDepuisEtat } from './mode1';

export type NomPresetMode1 =
  'terre' | 'mars' | 'halley' | 'cometeHyperbolique' | 'orbiteCirculaire' | 'parabole';

/**
 * Mars — NASA Goddard Space Flight Center, « Mars Fact Sheet », Mean Orbital Elements (J2000) :
 * a = 1,52366231 UA ; e = 0,09341233 (consulté le 2026-11-01).
 * https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
 */
const MARS_A = 1.52366231;
const MARS_E = 0.09341233;

/**
 * Comète de Halley — valeurs arrondies retenues par la spécification (§ 6.5) : e = 0,967, q = 0,59 UA.
 * Les sources divergent légèrement selon l'époque des éléments (spécification : e entre 0,9666 et
 * 0,9679 ; q entre 0,575 et 0,593 UA ; période ≈ 75–76 ans). Contrôle (consulté le 2026-11-01) :
 * JPL Small-Body Database, 1P/Halley, époque JD 2439875.5 : e = 0,968 ; q = 0,575 UA ; a = 17,9 UA ;
 * période 27 700 j (≈ 75,8 ans). https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=1P. Valeurs pédagogiques.
 */
const HALLEY_E = 0.967;
const HALLEY_Q = 0.59;

/** Comète hyperbolique fictive (§ 6.5) : e = 1,6 ; rp = 0,9 UA ; départ à ν = −105°. */
const HYPERBOLE_E = 1.6;
const HYPERBOLE_RP = 0.9;
const HYPERBOLE_NU_DEPART_DEG = -105;

/** Orbite de la Terre idéalisée : cercle de rayon 1 UA (définition de l'unité). */
const TERRE_R = 1;

/** Parabole : vitesse de libération à 1 UA → périhélie à 1 UA, départ au périhélie. */
const PARABOLE_RP = 1;

function depuisElements(d: Omit<ElementsDepart, 'omega' | 'sens'>): ReglagesMode1 {
  return reglagesDepuisEtat(etatDepuisElements({ ...d, omega: 0, sens: 1 }));
}

/**
 * Réglages d'un préréglage. « Orbite circulaire » dépend des réglages courants : elle conserve
 * la distance, le sens et la position de départ, et donne la vitesse circulaire tangentielle.
 */
export function presetMode1(nom: NomPresetMode1, courant: ReglagesMode1): ReglagesMode1 {
  switch (nom) {
    case 'terre':
      return depuisElements({ p: TERRE_R, e: 0, nu: 0 });
    case 'mars':
      // Départ à l'aphélie (ν = π).
      return depuisElements({ p: MARS_A * (1 - MARS_E ** 2), e: MARS_E, nu: Math.PI });
    case 'halley':
      // Départ au périhélie.
      return depuisElements({ p: parametreDepuisPeriapse(HALLEY_Q, HALLEY_E), e: HALLEY_E, nu: 0 });
    case 'cometeHyperbolique':
      return depuisElements({
        p: parametreDepuisPeriapse(HYPERBOLE_RP, HYPERBOLE_E),
        e: HYPERBOLE_E,
        nu: degToRad(HYPERBOLE_NU_DEPART_DEG),
      });
    case 'parabole':
      return depuisElements({ p: parametreDepuisPeriapse(PARABOLE_RP, 1), e: 1, nu: 0 });
    case 'orbiteCirculaire': {
      const etat = etatDepuisElements({
        p: courant.r0,
        e: 0,
        nu: 0,
        omega: courant.phi0,
        sens: courant.sens,
      });
      return reglagesDepuisEtat(etat);
    }
  }
}
