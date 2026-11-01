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
