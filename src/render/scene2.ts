/**
 * Dessin de la scène du mode 2 (deux corps) dans le point de vue choisi (§ 5.6). Les grandeurs
 * physiques viennent de la simulation ; ce fichier ne fait que de la géométrie d'écran.
 */

import { RAYON_CORPS_COEF_PX, RAYON_CORPS_MAX_PX, RAYON_CORPS_MIN_PX } from '../config';
import { format } from '../format';
import { fr } from '../i18n/fr';
import { echantillonnerConique } from '../physics/kepler';
import { type CorpsMode2 } from '../physics/mode2';
import { type OptionsMode2 } from '../sim/options';
import { type SimulationMode2 } from '../sim/simulationMode2';
import { type TraceDuo } from '../sim/traceDuo';
import { type Boite, type Camera, type Point, boiteDe, rayonVisible, versEcran } from './camera';
import { dessinerEtoiles, disque, etiquette, fleche, tracerPolyligne } from './primitives';
import { type NomCorps, type PointDeVue, origine, poidsOrigine } from './referentiel';
import { theme } from './theme';

/** Rayon de dessin d'un corps (F-SIM-5) : clamp(13·m^(1/3), 5, 26) px. */
export function rayonCorpsPx(masse: number): number {
  return Math.min(
    RAYON_CORPS_MAX_PX,
    Math.max(RAYON_CORPS_MIN_PX, RAYON_CORPS_COEF_PX * Math.cbrt(masse)),
  );
}

/** Distance minimale (px) entre le centre d'une étiquette et un corps pour la garder en place. */
const DEGAGEMENT_ETIQUETTE_PX = 60;

const COULEURS: Record<NomCorps, string> = { a: theme.corpsA, b: theme.corpsB };

/** Position affichée d'un corps : r⃗ − O, l'origine étant calculée aux mêmes instants. */
function affiche(
  poids: readonly [number, number],
  a: CorpsMode2,
  b: CorpsMode2,
  quel: NomCorps,
): Point {
  const o = origine(poids, a.r.x, a.r.y, b.r.x, b.r.y);
  const c = quel === 'a' ? a : b;
  return { x: c.r.x - o.x, y: c.r.y - o.y };
}

/** Positions de départ affichées (repère du point de vue à t = 0). */
export function departsAffiches(sim: SimulationMode2, vue: PointDeVue): Record<NomCorps, Point> {
  const { a, b } = sim.reglages;
  const poids = poidsOrigine(vue, a.masse, b.masse);
  return { a: affiche(poids, a, b, 'a'), b: affiche(poids, a, b, 'b') };
}

/**
 * Orbites prévues (§ 5.4, § 5.6) : courbes statiques dans le point de vue choisi.
 * Centre de masse : deux coniques semblables à l'orbite relative, de rapports −mB/M et mA/M.
 * Centré sur A (resp. B) : la seule conique de r⃗_rel (resp. −r⃗_rel). Fixe : comme le centre de
 * masse décalé de G_cm, seulement si V_cm est nulle — sinon `null` (orbites masquées).
 * `rVue` : rayon (UA) jusqu'auquel tracer une orbite ouverte, dans le repère affiché.
 */
export function orbitesPrevues(
  sim: SimulationMode2,
  vue: PointDeVue,
  rVue: number,
): Partial<Record<NomCorps, Float64Array>> | null {
  if (sim.classificationRelative.type === 'droite') return null;
  if (vue === 'fixe' && sim.derive) return null;
  const { a, b } = sim.reglages;
  const m = a.masse + b.masse;
  const facteurs: Partial<Record<NomCorps, number>> =
    vue === 'centreA'
      ? { b: 1 }
      : vue === 'centreB'
        ? { a: -1 }
        : { a: -b.masse / m, b: a.masse / m };
  const plusPetit = Math.min(...Object.values(facteurs).map(Math.abs));
  const rel = echantillonnerConique(sim.elementsRelatifs, rVue / plusPetit).points;
  const decalage = vue === 'fixe' ? sim.grandeurs.gCm : { x: 0, y: 0 };
  const resultat: Partial<Record<NomCorps, Float64Array>> = {};
  for (const quel of ['a', 'b'] as const) {
    const k = facteurs[quel];
    if (k === undefined) continue;
    const pts = new Float64Array(rel.length);
    for (let i = 0; i + 1 < rel.length; i += 2) {
      pts[i] = k * (rel[i] ?? 0) + decalage.x;
      pts[i + 1] = k * (rel[i + 1] ?? 0) + decalage.y;
    }
    resultat[quel] = pts;
  }
  return resultat;
}

/**
 * Boîte du cadrage automatique (F-SIM-4) : orbites prévues (ellipse entière ; orbite ouverte
 * jusqu'à max(2·d₀, 4·rp) en distance relative), positions de départ et origine du point de vue.
 */
export function boiteCadrageMode2(sim: SimulationMode2, vue: PointDeVue): Boite {
  const departs = departsAffiches(sim, vue);
  const cl = sim.classificationRelative;
  const el = sim.elementsRelatifs;
  const d0 = Math.hypot(sim.grandeurs.relatif.r.x, sim.grandeurs.relatif.r.y);
  const ferme = cl.type === 'conique' && (cl.forme === 'cercle' || cl.forme === 'ellipse');
  const rVue = ferme ? Infinity : Math.max(2 * d0, 4 * el.rp);
  // En vue fixe (avec ou sans dérive), on cadre les orbites autour du centre de masse initial.
  const orbites = orbitesPrevues(sim, vue === 'fixe' ? 'centreDeMasse' : vue, rVue);
  const decalage = vue === 'fixe' ? sim.grandeurs.gCm : { x: 0, y: 0 };
  const points: number[] = [];
  for (const pts of Object.values(orbites ?? {})) {
    for (let i = 0; i + 1 < pts.length; i += 2) {
      points.push((pts[i] ?? 0) + decalage.x, (pts[i + 1] ?? 0) + decalage.y);
    }
  }
  return boiteDe(points, departs.a, departs.b, { x: 0, y: 0 });
}

function tracerTraceDuo(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  trace: TraceDuo,
  vue: PointDeVue,
  quel: NomCorps,
): void {
  const poids = poidsOrigine(vue, trace.masses[0], trace.masses[1]);
  ctx.beginPath();
  trace.parcourir((xA, yA, xB, yB, rang) => {
    const o = origine(poids, xA, yA, xB, yB);
    const p =
      quel === 'a' ? versEcran(cam, xA - o.x, yA - o.y) : versEcran(cam, xB - o.x, yB - o.y);
    if (rang === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
}

function croix(ctx: CanvasRenderingContext2D, p: Point, demi: number): void {
  ctx.beginPath();
  ctx.moveTo(p.x - demi, p.y);
  ctx.lineTo(p.x + demi, p.y);
  ctx.moveTo(p.x, p.y - demi);
  ctx.lineTo(p.x, p.y + demi);
  ctx.stroke();
}

export function dessinerScene2(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  sim: SimulationMode2,
  options: OptionsMode2,
): void {
  const vue = options.pointDeVue;
  const { a, b } = sim.corps;
  const poids = poidsOrigine(vue, a.masse, b.masse);
  const enEdition = sim.etat === 'edition';
  // Le corps qui sert d'origine reste au centre : pas de trace ni d'orbite pour lui.
  const corpsMobiles: NomCorps[] =
    vue === 'centreA' ? ['b'] : vue === 'centreB' ? ['a'] : ['a', 'b'];

  ctx.fillStyle = theme.fondSimulation;
  ctx.fillRect(0, 0, cam.largeur, cam.hauteur);
  dessinerEtoiles(ctx, cam);

  // Orbites prévues.
  if (options.orbitesPrevues) {
    const orbites = orbitesPrevues(sim, vue, rayonVisible(cam, { x: 0, y: 0 }));
    const fermee =
      sim.classificationRelative.type === 'conique' &&
      (sim.classificationRelative.forme === 'cercle' ||
        sim.classificationRelative.forme === 'ellipse');
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 7]);
    ctx.globalAlpha = 0.75;
    for (const quel of ['a', 'b'] as const) {
      const pts = orbites?.[quel];
      if (!pts) continue;
      ctx.strokeStyle = COULEURS[quel];
      tracerPolyligne(ctx, cam, pts);
      if (fermee) ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Traînées (anciennes atténuées, puis en cours jusqu'aux corps).
  const pA = versEcran(cam, ...xy(affiche(poids, a, b, 'a')));
  const pB = versEcran(cam, ...xy(affiche(poids, a, b, 'b')));
  const positions: Record<NomCorps, Point> = { a: pA, b: pB };
  if (options.trainees) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;
    for (const ancienne of sim.anciennesTraces) {
      for (const quel of corpsMobiles) {
        ctx.strokeStyle = COULEURS[quel];
        tracerTraceDuo(ctx, cam, ancienne, vue, quel);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    if (sim.trace.longueur > 0) {
      for (const quel of corpsMobiles) {
        ctx.strokeStyle = COULEURS[quel];
        tracerTraceDuo(ctx, cam, sim.trace, vue, quel);
        if (!enEdition) ctx.lineTo(positions[quel].x, positions[quel].y);
        ctx.stroke();
      }
    }
  }

  // Ligne A–B, qui passe par le centre de masse.
  if (options.ligneAB) {
    ctx.strokeStyle = theme.repere;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 5]);
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // Centre de masse (croix).
  if (options.centreDeMasse) {
    const m = a.masse + b.masse;
    const g = {
      x: (a.masse * a.r.x + b.masse * b.r.x) / m,
      y: (a.masse * a.r.y + b.masse * b.r.y) / m,
    };
    const o = origine(poids, a.r.x, a.r.y, b.r.x, b.r.y);
    const pg = versEcran(cam, g.x - o.x, g.y - o.y);
    ctx.strokeStyle = theme.texte;
    ctx.lineWidth = 2;
    croix(ctx, pg, 12);
    // Étiquette au-dessus à gauche de la croix, ou en dessous si un corps y est déjà.
    const libre = (y: number) =>
      [pA, pB].every((p) => Math.hypot(p.x - (pg.x - 70), p.y - y) > DEGAGEMENT_ETIQUETTE_PX);
    const yEtiquette = libre(pg.y - 26) ? pg.y - 26 : pg.y + 28;
    etiquette(ctx, fr.scene2.centreDeMasse, pg.x - 16, yEtiquette, theme.texte, undefined, 'right');
  }

  // Départs et flèches de vitesse : en Édition, flèches toujours visibles (D-24).
  const departs = departsAffiches(sim, vue);
  const depart = sim.reglages;
  // Le corps servant d'origine reste au centre : ni marqueur de départ ni flèche pour lui.
  for (const quel of corpsMobiles) {
    const pd = versEcran(cam, departs[quel].x, departs[quel].y);
    if (!enEdition) {
      ctx.strokeStyle = theme.texte;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(pd.x, pd.y, rayonCorpsPx(depart[quel].masse), 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      etiquette(
        ctx,
        fr.scene2.depart(quel.toUpperCase()),
        pd.x + rayonCorpsPx(depart[quel].masse) + 8,
        pd.y + 2,
        theme.texteSecondaire,
      );
    }
  }

  // Corps.
  for (const quel of ['a', 'b'] as const) {
    const c = quel === 'a' ? a : b;
    const p = positions[quel];
    const rayon = rayonCorpsPx(c.masse);
    disque(ctx, p.x, p.y, rayon + 2, theme.texte);
    disque(ctx, p.x, p.y, rayon, COULEURS[quel]);
    etiquette(ctx, quel.toUpperCase(), p.x + rayon + 8, p.y - 12, COULEURS[quel]);
    etiquette(
      ctx,
      fr.scene2.masse(format(c.masse)),
      p.x + rayon + 8,
      p.y + 12,
      theme.texte,
      theme.polices.valeur,
    );
  }

  // Flèches de vitesse par-dessus les corps (un gros corps masquerait une flèche courte).
  for (const quel of corpsMobiles) {
    if (enEdition) {
      const pd = versEcran(cam, departs[quel].x, departs[quel].y);
      fleche(ctx, pd, depart[quel].v, theme.texte);
    } else if (options.flechesVitesse) {
      fleche(ctx, positions[quel], (quel === 'a' ? a : b).v, theme.texte);
    }
  }
}

function xy(p: Point): [number, number] {
  return [p.x, p.y];
}
