import type { PointDeVue } from '../render/referentiel';
import { Observable } from './observable';

/** Affichages du mode 1 (F-M1-7) et aimant (F-M1-3). Valeurs par défaut de la spécification. */
export interface OptionsMode1 {
  orbitePrevue: boolean;
  perihelieAphelie: boolean;
  foyers: boolean;
  cercleReference: boolean;
  /** Visible seulement pour une hyperbole ; activé par défaut (maquette 2). */
  asymptotes: boolean;
  loiDesAires: boolean;
  aimant: boolean;
}

export const OPTIONS_MODE1_DEFAUT: OptionsMode1 = {
  orbitePrevue: true,
  perihelieAphelie: true,
  foyers: false,
  cercleReference: false,
  asymptotes: true,
  loiDesAires: false,
  aimant: true,
};

/** Affichages du mode 2 (F-M2-3) et point de vue (F-M2-2). Valeurs par défaut de la spécification. */
export interface OptionsMode2 {
  orbitesPrevues: boolean;
  trainees: boolean;
  centreDeMasse: boolean;
  ligneAB: boolean;
  /** Pendant la simulation ; en Édition, les flèches sont toujours visibles (D-24). */
  flechesVitesse: boolean;
  pointDeVue: PointDeVue;
}

export const OPTIONS_MODE2_DEFAUT: OptionsMode2 = {
  orbitesPrevues: true,
  trainees: true,
  centreDeMasse: true,
  ligneAB: true,
  flechesVitesse: false,
  pointDeVue: 'centreDeMasse',
};

export class Options<T extends object> extends Observable {
  private courantes: T;

  constructor(initiales: T) {
    super();
    this.courantes = initiales;
  }

  get valeurs(): Readonly<T> {
    return this.courantes;
  }

  definir<K extends keyof T>(cle: K, valeur: T[K]): void {
    this.courantes = { ...this.courantes, [cle]: valeur };
    this.notifier();
  }
}
