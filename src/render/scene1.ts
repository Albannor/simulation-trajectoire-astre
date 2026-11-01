/**
 * Dessin de la scène du mode 1 sur un canvas 2D. Toute grandeur physique vient du module
 * physics/ (via la simulation) ; ce fichier ne fait que de la géométrie d'écran.
 */

import {
  FLECHE_MAX_PX,
  FLECHE_MIN_PX,
  FLECHE_PX_PAR_VITESSE,
  RAYON_ASTRE_PX,
  RAYON_SOLEIL_PX,
} from '../config';
import { format } from '../format';
import { fr } from '../i18n/fr';
import {
  type BodyState,
  type Classification,
  type OrbitElements,
  echantillonnerConique,
  rayonMaxRadial,
} from '../physics/kepler';
import { type SimulationMode1, formeDe } from '../sim/simulationMode1';
import { type Trace } from '../sim/trace';
import { type Boite, type Camera, boiteDe, rayonVisible, versEcran } from './camera';
import { theme } from './theme';

const ORIGINE = { x: 0, y: 0 };

/** Décalage de l'étiquette de distance par rapport au trait Soleil–astre (px). */
const DECALAGE_ETIQUETTE_PX = 6;
/** Demi-hauteur approximative d'une ligne de texte de 14 px. */
const DEMI_HAUTEUR_TEXTE_PX = 8;

/**
 * Boîte du cadrage automatique (F-SIM-4) : ellipse (ou cercle) entière ; orbite ouverte jusqu'à
 * R_vue = max(2·r₀, 4·rp) ; trajectoire droite jusqu'à sa hauteur maximale (ou 2·r₀) ; plus le Soleil.
 */
export function boiteCadrageMode1(depart: BodyState, el: OrbitElements, cl: Classification): Boite {
  const r0 = Math.hypot(depart.r.x, depart.r.y);
  if (cl.type === 'droite') {
    const rMax = Math.min(rayonMaxRadial(depart, el.mu), 2 * r0);
    const loin = { x: (depart.r.x * rMax) / r0, y: (depart.r.y * rMax) / r0 };
    return boiteDe([], ORIGINE, depart.r, loin);
  }
  const ferme = cl.forme === 'cercle' || cl.forme === 'ellipse';
  const rVue = ferme ? Infinity : Math.max(2 * r0, 4 * el.rp);
  return boiteDe(echantillonnerConique(el, rVue).points, ORIGINE, depart.r);
}

// ——— Étoiles décoratives (fixes, déterministes) ———

const ETOILES = (() => {
  let graine = 12345;
  const alea = () => {
    graine = (graine * 1103515245 + 12345) % 2147483648;
    return graine / 2147483648;
  };
  return Array.from({ length: 70 }, () => ({ u: alea(), v: alea(), r: 0.5 + alea() * 0.9 }));
})();

function dessinerEtoiles(ctx: CanvasRenderingContext2D, cam: Camera): void {
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

function tracerPolyligne(
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

function tracerTrace(ctx: CanvasRenderingContext2D, cam: Camera, trace: Trace): void {
  ctx.beginPath();
  trace.parcourir((x, y, rang) => {
    const p = versEcran(cam, x, y);
    if (rang === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
}

function disque(
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

function etiquette(
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

/** Flèche de vitesse : 12 px par UA/an, bornée à [10 ; 200] px (F-M1-2). */
function fleche(
  ctx: CanvasRenderingContext2D,
  depuis: { x: number; y: number },
  v: { x: number; y: number },
  couleur: string,
): void {
  const vitesse = Math.hypot(v.x, v.y);
  if (vitesse === 0) return;
  const longueur = Math.min(
    FLECHE_MAX_PX,
    Math.max(FLECHE_MIN_PX, FLECHE_PX_PAR_VITESSE * vitesse),
  );
  // Écran : y vers le bas.
  const ux = v.x / vitesse;
  const uy = -v.y / vitesse;
  const bx = depuis.x + ux * longueur;
  const by = depuis.y + uy * longueur;
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

// ——— Scène ———

function dessinerOrbitePrevue(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  sim: SimulationMode1,
  couleur: string,
): void {
  const { depart, elements: el, classification: cl } = sim;
  ctx.strokeStyle = couleur;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 7]);
  ctx.globalAlpha = 0.8;
  if (cl.type === 'droite') {
    const r0 = Math.hypot(depart.r.x, depart.r.y);
    const rMax =
      cl.issue === 'tombe'
        ? r0
        : Math.min(rayonMaxRadial(depart, el.mu), rayonVisible(cam, ORIGINE));
    const a = versEcran(cam, 0, 0);
    const b = versEcran(cam, (depart.r.x * rMax) / r0, (depart.r.y * rMax) / r0);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  } else {
    const conique = echantillonnerConique(el, rayonVisible(cam, ORIGINE));
    tracerPolyligne(ctx, cam, conique.points);
    if (conique.fermee) ctx.closePath();
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export function dessinerScene1(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  sim: SimulationMode1,
): void {
  const couleur = theme.formes[formeDe(sim.classification)];
  const enEdition = sim.etat === 'edition';
  const astre = sim.astre;
  const soleil = versEcran(cam, 0, 0);
  const pAstre = versEcran(cam, astre.r.x, astre.r.y);
  const pDepart = versEcran(cam, sim.depart.r.x, sim.depart.r.y);

  ctx.fillStyle = theme.fondSimulation;
  ctx.fillRect(0, 0, cam.largeur, cam.hauteur);
  dessinerEtoiles(ctx, cam);

  // Orbite prévue (§ 5.4).
  dessinerOrbitePrevue(ctx, cam, sim, couleur);

  // Anciennes traces, atténuées (F-APP-5).
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.3;
  for (const ancienne of sim.anciennesTraces) {
    ctx.strokeStyle = theme.formes[ancienne.forme];
    tracerTrace(ctx, cam, ancienne.trace);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Trace en cours, prolongée jusqu'à l'astre.
  if (sim.trace.longueur > 0) {
    ctx.strokeStyle = theme.formes[sim.formeTrace];
    ctx.lineWidth = 3;
    tracerTrace(ctx, cam, sim.trace);
    if (!enEdition) ctx.lineTo(pAstre.x, pAstre.y);
    ctx.stroke();
  }

  // Distance Soleil–astre (F-M1-10).
  const distance = Math.hypot(astre.r.x, astre.r.y);
  ctx.strokeStyle = theme.repere;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 5]);
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(soleil.x, soleil.y);
  ctx.lineTo(pAstre.x, pAstre.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  // Valeur au milieu du trait, décalée perpendiculairement pour ne pas chevaucher le trait :
  // le décalage tient compte de l'encombrement du texte dans la direction de la normale.
  const texteDistance = `${format(distance)} ${fr.unites.distance}`;
  ctx.font = theme.polices.valeur;
  const demiLargeur = ctx.measureText(texteDistance).width / 2;
  const dx = pAstre.x - soleil.x;
  const dy = pAstre.y - soleil.y;
  const longueur = Math.hypot(dx, dy) || 1;
  const sensNormale = dx >= 0 ? 1 : -1;
  const nx = (sensNormale * dy) / longueur;
  const ny = (-sensNormale * dx) / longueur;
  const decalage =
    DECALAGE_ETIQUETTE_PX + Math.abs(nx) * demiLargeur + Math.abs(ny) * DEMI_HAUTEUR_TEXTE_PX;
  etiquette(
    ctx,
    texteDistance,
    (soleil.x + pAstre.x) / 2 + nx * decalage,
    (soleil.y + pAstre.y) / 2 + ny * decalage,
    theme.texte,
    theme.polices.valeur,
    'center',
  );

  // Soleil (22 px, sans échelle — F-SIM-5).
  ctx.globalAlpha = 0.18;
  disque(ctx, soleil.x, soleil.y, RAYON_SOLEIL_PX * 1.75, theme.accent);
  ctx.globalAlpha = 1;
  disque(ctx, soleil.x, soleil.y, RAYON_SOLEIL_PX, theme.accent);
  etiquette(
    ctx,
    fr.scene.soleil,
    soleil.x,
    soleil.y + RAYON_SOLEIL_PX + 16,
    theme.accent,
    undefined,
    'center',
  );

  // Point de départ et flèche fantôme (F-M1-9) pendant et après la simulation.
  if (!enEdition) {
    ctx.strokeStyle = theme.texte;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(pDepart.x, pDepart.y, RAYON_ASTRE_PX, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.55;
    fleche(ctx, pDepart, sim.depart.v, theme.texteSecondaire);
    ctx.globalAlpha = 1;
    etiquette(ctx, fr.scene.depart, pDepart.x + 18, pDepart.y + 2, theme.texteSecondaire);
  } else {
    fleche(ctx, pAstre, sim.depart.v, theme.texte);
  }

  // Astre (10 px).
  disque(ctx, pAstre.x, pAstre.y, RAYON_ASTRE_PX + 2, theme.texte);
  disque(ctx, pAstre.x, pAstre.y, RAYON_ASTRE_PX, couleur);
  etiquette(ctx, fr.scene.astre, pAstre.x + 16, pAstre.y - 16, couleur);
}
