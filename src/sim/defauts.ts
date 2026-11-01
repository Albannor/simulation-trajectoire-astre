import { REGLAGES_DEFAUT_MODE1 } from '../config';
import { degToRad } from '../physics/constants';
import { type ReglagesMode1, avecPerihelieADroite } from '../physics/mode1';

/** Réglages du mode 1 au premier démarrage (D-20), orientés périhélie à droite. */
export const DEFAUT_MODE1: ReglagesMode1 = avecPerihelieADroite({
  r0: REGLAGES_DEFAUT_MODE1.r0,
  v0: REGLAGES_DEFAUT_MODE1.v0,
  theta: degToRad(REGLAGES_DEFAUT_MODE1.thetaDeg),
  sens: REGLAGES_DEFAUT_MODE1.sens,
  phi0: 0,
});
