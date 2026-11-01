/**
 * Préréglages du mode 1, définis par éléments orbitaux et convertis en état initial (§ 6.5).
 * Convention d'affichage : périhélie à droite du Soleil (ω = 0), sens anti-horaire ; la position
 * de départ φ₀ s'en déduit (sans effet physique).
 */

import { degToRad } from './constants';
import { etatDepuisElements, parametreDepuisPeriapse, type ElementsDepart } from './kepler';
import { type ReglagesMode1, reglagesDepuisEtat } from './mode1';
import { type ReglagesMode2, grandeursMode2, reglagesDepuisRelatif } from './mode2';
import { cross, norm } from './vec2';
import { G } from './constants';

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

// ——— Mode 2 (§ 6.5) ———

export type NomPresetMode2 =
  'massesEgales' | 'grosEtPetit' | 'planeteSoleil' | 'visiteur' | 'orbiteCirculaire';

/**
 * Orbite relative définie par éléments, barycentre à l'origine et vitesse totale nulle. Orientation
 * d'affichage : au départ, B est au-dessus de A (r⃗_rel vers le haut, comme sur la maquette 3).
 */
function duo(mA: number, mB: number, p: number, e: number, nu: number): ReglagesMode2 {
  const rel = etatDepuisElements({ p, e, nu, omega: Math.PI / 2 - nu, sens: 1 }, G * (mA + mB));
  return reglagesDepuisRelatif(mA, mB, rel);
}

/** « Un visiteur qui passe » : départ à 6 UA sur la branche d'approche (ν < 0, décision D-05). */
const VISITEUR_E = 1.5;
const VISITEUR_RP = 1;
const VISITEUR_DEPART = 6;

export function presetMode2(nom: NomPresetMode2, courant: ReglagesMode2): ReglagesMode2 {
  switch (nom) {
    case 'massesEgales':
      // Cercle de demi-grand axe 2 UA.
      return duo(1, 1, 2, 0, 0);
    case 'grosEtPetit':
      // Ellipse a = 2 UA, e = 0,5, départ à l'apoastre (ν = π).
      return duo(1, 0.1, 2 * (1 - 0.5 ** 2), 0.5, Math.PI);
    case 'planeteSoleil':
      // Cercle de 1 UA, rapport 1 : 100.
      return duo(1, 0.01, 1, 0, 0);
    case 'visiteur': {
      const p = parametreDepuisPeriapse(VISITEUR_RP, VISITEUR_E);
      const nu = -Math.acos((p / VISITEUR_DEPART - 1) / VISITEUR_E);
      return duo(1, 0.1, p, VISITEUR_E, nu);
    }
    case 'orbiteCirculaire': {
      // Masses courantes, cercle à la distance courante, même direction et même sens de rotation.
      const g = grandeursMode2(courant.a, courant.b);
      const d = norm(g.relatif.r);
      const rel = etatDepuisElements(
        {
          p: d,
          e: 0,
          nu: 0,
          omega: Math.atan2(g.relatif.r.y, g.relatif.r.x),
          sens: cross(g.relatif.r, g.relatif.v) < 0 ? -1 : 1,
        },
        g.mu,
      );
      return reglagesDepuisRelatif(courant.a.masse, courant.b.masse, rel);
    }
  }
}
