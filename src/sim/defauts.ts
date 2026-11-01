import { REGLAGES_DEFAUT_MODE1, REGLAGES_DEFAUT_MODE2 } from '../config';
import { degToRad } from '../physics/constants';
import { type ReglagesMode1, avecPerihelieADroite } from '../physics/mode1';
import { type ReglagesMode2, reglagesDepuisRelatif } from '../physics/mode2';

/** Réglages du mode 1 au premier démarrage (D-20), orientés périhélie à droite. */
export const DEFAUT_MODE1: ReglagesMode1 = avecPerihelieADroite({
  r0: REGLAGES_DEFAUT_MODE1.r0,
  v0: REGLAGES_DEFAUT_MODE1.v0,
  theta: degToRad(REGLAGES_DEFAUT_MODE1.thetaDeg),
  sens: REGLAGES_DEFAUT_MODE1.sens,
  phi0: 0,
});

/** Réglages du mode 2 au premier démarrage (D-25) : maquette 3, barycentre à l'origine. */
export const DEFAUT_MODE2: ReglagesMode2 = reglagesDepuisRelatif(
  REGLAGES_DEFAUT_MODE2.masseA,
  REGLAGES_DEFAUT_MODE2.masseB,
  { r: REGLAGES_DEFAUT_MODE2.rRel, v: REGLAGES_DEFAUT_MODE2.vRel },
);
