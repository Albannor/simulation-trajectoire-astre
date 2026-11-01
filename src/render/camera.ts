/**
 * Caméra 2D : passage monde (UA, y vers le haut) ↔ écran (px CSS, y vers le bas).
 * L'inversion de l'axe y n'a lieu qu'ici (CLAUDE.md, règle 4). Fonctions pures.
 */

import { ECHELLE_MAX, ECHELLE_MIN } from '../config';

export interface Camera {
  /** Point du monde au centre de l'écran (UA). */
  readonly cx: number;
  readonly cy: number;
  /** px CSS par UA. */
  readonly echelle: number;
  /** Taille de la zone de dessin (px CSS). */
  readonly largeur: number;
  readonly hauteur: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Boite {
  readonly xmin: number;
  readonly xmax: number;
  readonly ymin: number;
  readonly ymax: number;
}

export function versEcran(cam: Camera, x: number, y: number): Point {
  return {
    x: cam.largeur / 2 + (x - cam.cx) * cam.echelle,
    y: cam.hauteur / 2 - (y - cam.cy) * cam.echelle,
  };
}

export function versMonde(cam: Camera, sx: number, sy: number): Point {
  return {
    x: cam.cx + (sx - cam.largeur / 2) / cam.echelle,
    y: cam.cy - (sy - cam.hauteur / 2) / cam.echelle,
  };
}

function bornerEchelle(echelle: number): number {
  return Math.min(ECHELLE_MAX, Math.max(ECHELLE_MIN, echelle));
}

/** Zoom de facteur `facteur` en gardant fixe le point écran (sx, sy). */
export function zoomerAutour(cam: Camera, facteur: number, sx: number, sy: number): Camera {
  const fixe = versMonde(cam, sx, sy);
  const echelle = bornerEchelle(cam.echelle * facteur);
  return {
    ...cam,
    echelle,
    cx: fixe.x - (sx - cam.largeur / 2) / echelle,
    cy: fixe.y + (sy - cam.hauteur / 2) / echelle,
  };
}

/** Déplacement de la vue quand on glisse le fond de (dx, dy) px. */
export function deplacer(cam: Camera, dx: number, dy: number): Camera {
  return { ...cam, cx: cam.cx - dx / cam.echelle, cy: cam.cy + dy / cam.echelle };
}

export function redimensionner(cam: Camera, largeur: number, hauteur: number): Camera {
  return { ...cam, largeur, hauteur };
}

/** Caméra qui contient `boite` avec une marge (px) de chaque côté. */
export function cadrer(boite: Boite, largeur: number, hauteur: number, marge: number): Camera {
  const l = Math.max(1, largeur - 2 * marge);
  const h = Math.max(1, hauteur - 2 * marge);
  const dx = Math.max(boite.xmax - boite.xmin, 1e-6);
  const dy = Math.max(boite.ymax - boite.ymin, 1e-6);
  return {
    cx: (boite.xmin + boite.xmax) / 2,
    cy: (boite.ymin + boite.ymax) / 2,
    echelle: bornerEchelle(Math.min(l / dx, h / dy)),
    largeur,
    hauteur,
  };
}

/** Plus petite boîte contenant les points (coordonnées entrelacées) et les points isolés. */
export function boiteDe(entrelaces: ArrayLike<number>, ...points: Point[]): Boite {
  let xmin = Infinity;
  let xmax = -Infinity;
  let ymin = Infinity;
  let ymax = -Infinity;
  const inclure = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    xmin = Math.min(xmin, x);
    xmax = Math.max(xmax, x);
    ymin = Math.min(ymin, y);
    ymax = Math.max(ymax, y);
  };
  for (let k = 0; k + 1 < entrelaces.length; k += 2) {
    inclure(entrelaces[k] ?? Number.NaN, entrelaces[k + 1] ?? Number.NaN);
  }
  points.forEach((p) => inclure(p.x, p.y));
  return { xmin, xmax, ymin, ymax };
}

/** Distance maximale (UA) entre `centre` et les coins de l'écran : « R_vue » du § 5.4. */
export function rayonVisible(cam: Camera, centre: Point): number {
  const coins = [
    versMonde(cam, 0, 0),
    versMonde(cam, cam.largeur, 0),
    versMonde(cam, 0, cam.hauteur),
    versMonde(cam, cam.largeur, cam.hauteur),
  ];
  return Math.max(...coins.map((c) => Math.hypot(c.x - centre.x, c.y - centre.y)));
}

/**
 * Pincement à deux doigts (F-SIM-3) : les doigts passent de (a1, a2) à (b1, b2) (px écran).
 * Zoom du rapport des écartements autour du milieu initial, puis déplacement du milieu :
 * le point du monde sous le milieu des doigts reste sous leur milieu.
 */
export function pincer(cam: Camera, a1: Point, a2: Point, b1: Point, b2: Point): Camera {
  const ecartA = Math.hypot(a2.x - a1.x, a2.y - a1.y);
  const ecartB = Math.hypot(b2.x - b1.x, b2.y - b1.y);
  const milieuA = { x: (a1.x + a2.x) / 2, y: (a1.y + a2.y) / 2 };
  const milieuB = { x: (b1.x + b2.x) / 2, y: (b1.y + b2.y) / 2 };
  const facteur = ecartA > 0 ? ecartB / ecartA : 1;
  const zoome = zoomerAutour(cam, facteur, milieuA.x, milieuA.y);
  return deplacer(zoome, milieuB.x - milieuA.x, milieuB.y - milieuA.y);
}
