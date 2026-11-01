/** Primitives de dessin communes aux scènes (canvas 2D, px CSS). */

import { FLECHE_MAX_PX, FLECHE_MIN_PX, FLECHE_PX_PAR_VITESSE } from '../config';
import { type Camera, type Point, versEcran } from './camera';
import { theme } from './theme';

// ——— Étoiles décoratives (fixes, déterministes) ———

const ETOILES = (() => {
  let graine = 12345;
  const alea = () => {
    graine = (graine * 1103515245 + 12345) % 2147483648;
    return graine / 2147483648;
  };
  return Array.from({ length: 70 }, () => ({ u: alea(), v: alea(), r: 0.5 + alea() * 0.9 }));
})();

export function dessinerEtoiles(ctx: CanvasRenderingContext2D, cam: Camera): void {
  ctx.fillStyle = theme.etoile;
  ctx.globalAlpha = 0.45;
  for (const e of ETOILES) {
    ctx.beginPath();
    ctx.arc(e.u * cam.largeur, e.v * cam.hauteur, e.r, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ——— Primitives ———

export function tracerPolyligne(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  points: ArrayLike<number>,
): void {
  ctx.beginPath();
  for (let k = 0; k + 1 < points.length; k += 2) {
    const p = versEcran(cam, points[k] ?? 0, points[k + 1] ?? 0);
    if (k === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
}

export function disque(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  remplissage: string,
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = remplissage;
  ctx.fill();
}

export function etiquette(
  ctx: CanvasRenderingContext2D,
  texte: string,
  x: number,
  y: number,
  couleur: string,
  police: string = theme.polices.etiquette,
  alignement: CanvasTextAlign = 'left',
): void {
  ctx.font = police;
  ctx.fillStyle = couleur;
  ctx.textAlign = alignement;
  ctx.textBaseline = 'middle';
  ctx.fillText(texte, x, y);
}

/**
 * Pointe de la flèche de vitesse à l'écran : 12 px par UA/an, longueur bornée à [10 ; 200] px
 * (F-M1-2). `null` si la vitesse est nulle.
 */
export function pointeFleche(depuis: Point, v: Point): Point | null {
  const vitesse = Math.hypot(v.x, v.y);
  if (vitesse === 0) return null;
  const longueur = Math.min(
    FLECHE_MAX_PX,
    Math.max(FLECHE_MIN_PX, FLECHE_PX_PAR_VITESSE * vitesse),
  );
  // Écran : y vers le bas.
  return { x: depuis.x + (v.x / vitesse) * longueur, y: depuis.y - (v.y / vitesse) * longueur };
}

export function fleche(
  ctx: CanvasRenderingContext2D,
  depuis: Point,
  v: Point,
  couleur: string,
): void {
  const pointe = pointeFleche(depuis, v);
  if (!pointe) return;
  const longueur = Math.hypot(pointe.x - depuis.x, pointe.y - depuis.y);
  const ux = (pointe.x - depuis.x) / longueur;
  const uy = (pointe.y - depuis.y) / longueur;
  const bx = pointe.x;
  const by = pointe.y;
  ctx.strokeStyle = couleur;
  ctx.fillStyle = couleur;
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(depuis.x, depuis.y);
  ctx.lineTo(bx - ux * 8, by - uy * 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx - ux * 12 - uy * 6, by - uy * 12 + ux * 6);
  ctx.lineTo(bx - ux * 12 + uy * 6, by - uy * 12 - ux * 6);
  ctx.closePath();
  ctx.fill();
}
