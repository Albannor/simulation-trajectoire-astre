/**
 * Mémorisation locale du dernier réglage (F-APP-3) : dernier mode, réglages de chaque mode,
 * interrupteur « Explications » et vitesse du temps. Toute lecture/écriture est protégée :
 * l'application fonctionne sans stockage. Les données relues sont validées champ par champ
 * (types et bornes) ; tout champ invalide est ignoré (décision D-29).
 */

import {
  MASSE_MAX,
  MASSE_MIN,
  MULTIPLICATEURS_TEMPS,
  POSITION_MAX_MODE2,
  R0_MAX,
  R0_MIN,
  V0_MAX,
  V0_MIN,
  VITESSE_MAX_MODE2,
} from './config';
import { type Mode } from './mode';
import { type ReglagesMode1 } from './physics/mode1';
import { type CorpsMode2, type ReglagesMode2 } from './physics/mode2';
import { type Vec2 } from './physics/vec2';

/** Clé unique, versionnée : un changement de format incompatible change de version. */
export const CLE_STOCKAGE = 'simulation-trajectoire-astre:v1';

export interface Memoire {
  mode: Mode;
  mode1: ReglagesMode1;
  mode2: ReglagesMode2;
  explications: boolean;
  multiplicateur: number;
}

/** Sous-ensemble de l'API Storage utilisé (permet de tester sans navigateur). */
export type Stockage = Pick<Storage, 'getItem' | 'setItem'>;

/** localStorage s'il est accessible (il peut être interdit : navigation privée, réglages). */
export function stockageNavigateur(): Stockage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// ——— Validation ———

function estObjet(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function nombre(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null;
}

function vecteur(v: unknown, max: number): Vec2 | null {
  if (!estObjet(v)) return null;
  const x = nombre(v.x, -max, max);
  const y = nombre(v.y, -max, max);
  return x === null || y === null ? null : { x, y };
}

function reglagesMode1(v: unknown): ReglagesMode1 | null {
  if (!estObjet(v)) return null;
  const r0 = nombre(v.r0, R0_MIN, R0_MAX);
  const v0 = nombre(v.v0, V0_MIN, V0_MAX);
  const theta = nombre(v.theta, 0, Math.PI);
  const phi0 = nombre(v.phi0, -2 * Math.PI, 2 * Math.PI);
  const sens = v.sens === 1 || v.sens === -1 ? v.sens : null;
  if (r0 === null || v0 === null || theta === null || phi0 === null || sens === null) return null;
  return { r0, v0, theta, sens, phi0 };
}

function corps(v: unknown): CorpsMode2 | null {
  if (!estObjet(v)) return null;
  const masse = nombre(v.masse, MASSE_MIN, MASSE_MAX);
  const r = vecteur(v.r, POSITION_MAX_MODE2);
  const vit = vecteur(v.v, VITESSE_MAX_MODE2);
  return masse === null || r === null || vit === null ? null : { masse, r, v: vit };
}

function reglagesMode2(v: unknown): ReglagesMode2 | null {
  if (!estObjet(v)) return null;
  const a = corps(v.a);
  const b = corps(v.b);
  return a === null || b === null ? null : { a, b };
}

/** Lit la mémoire ; ne renvoie que les champs valides (objet vide si rien d'utilisable). */
export function lireMemoire(stockage: Stockage | null): Partial<Memoire> {
  let brut: unknown;
  try {
    const texte = stockage?.getItem(CLE_STOCKAGE);
    if (!texte) return {};
    brut = JSON.parse(texte);
  } catch {
    return {};
  }
  if (!estObjet(brut)) return {};
  const memoire: Partial<Memoire> = {};
  if (brut.mode === 'mode1' || brut.mode === 'mode2') memoire.mode = brut.mode;
  const m1 = reglagesMode1(brut.mode1);
  if (m1) memoire.mode1 = m1;
  const m2 = reglagesMode2(brut.mode2);
  if (m2) memoire.mode2 = m2;
  if (typeof brut.explications === 'boolean') memoire.explications = brut.explications;
  if ((MULTIPLICATEURS_TEMPS as readonly unknown[]).includes(brut.multiplicateur)) {
    memoire.multiplicateur = brut.multiplicateur as number;
  }
  return memoire;
}

/** Écrit la mémoire ; renvoie faux si le stockage est absent, plein ou interdit. */
export function ecrireMemoire(stockage: Stockage | null, memoire: Memoire): boolean {
  if (!stockage) return false;
  try {
    stockage.setItem(CLE_STOCKAGE, JSON.stringify(memoire));
    return true;
  } catch {
    return false;
  }
}
