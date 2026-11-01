/** Simulation du mode 1 (un astre autour du Soleil), hors de React. */

import {
  NB_ANCIENNES_TRACES,
  SECTEURS_CONSERVES,
  SECTEURS_PAR_PERIODE,
  TRAINEE_MAX,
} from '../config';
import { type ResultatImage } from '../physics/integrator';
import {
  type BodyState,
  type Classification,
  type OrbitElements,
  type ShapeClass,
  classifier,
  dureeSecteur,
  elements,
} from '../physics/kepler';
import {
  type FinMode1,
  type ReglagesMode1,
  avancerMode1,
  creerSystemeMode1,
  ecartEnergie,
  etatAstre,
  etatInitialMode1,
} from '../physics/mode1';
import { SimulationBase } from './simulationBase';
import { Trace } from './trace';

/** Forme associée à une trace (pour sa couleur). */
export type FormeTrace = ShapeClass | 'droite';

export interface TraceArchivee {
  readonly trace: Trace;
  readonly forme: FormeTrace;
}

export function formeDe(cl: Classification): FormeTrace {
  return cl.type === 'droite' ? 'droite' : cl.forme;
}

/** Secteur de la loi des aires : points balayés (UA, entrelacés) pendant une durée Δt. */
export interface Secteur {
  /** Rang du secteur depuis le lancement (alternance des couleurs). */
  readonly rang: number;
  readonly points: number[];
}

export class SimulationMode1 extends SimulationBase<ReglagesMode1, FinMode1> {
  depart!: BodyState;
  elements!: OrbitElements;
  classification!: Classification;
  trace = new Trace(TRAINEE_MAX);
  /** Forme de la trace en cours. */
  formeTrace: FormeTrace = 'ellipse';
  anciennesTraces: TraceArchivee[] = [];

  /** Secteurs de la loi des aires (F-M1-8) : les derniers terminés puis celui en cours. */
  secteurs: Secteur[] = [];
  dureeSecteur: number | null = null;

  constructor(reglages: ReglagesMode1, multiplicateur: number) {
    super(reglages, multiplicateur);
    this.reinitialiser();
  }

  get astre(): BodyState {
    return etatAstre(this.systeme);
  }

  effacerTraces(): void {
    this.anciennesTraces = [];
    this.trace.vider();
    this.notifier();
  }

  protected reinitialiser(): void {
    this.depart = etatInitialMode1(this.reglagesCourants);
    this.elements = elements(this.depart);
    this.classification = classifier(this.depart);
    this.dureeSecteur = dureeSecteur(this.elements, this.classification, SECTEURS_PAR_PERIODE);
    this.secteurs = [];
    this.systeme = creerSystemeMode1(this.depart);
    this.fin = null;
    this.ralenti = false;
    this.ecartEnergie = 0;
  }

  protected demarrerTrace(): void {
    if (this.trace.longueur > 1) {
      this.anciennesTraces = [
        ...this.anciennesTraces,
        { trace: this.trace, forme: this.formeTrace },
      ].slice(-NB_ANCIENNES_TRACES);
      this.trace = new Trace(TRAINEE_MAX);
    } else {
      this.trace.vider();
    }
    this.formeTrace = formeDe(this.classification);
    this.trace.ajouter(this.depart.r.x, this.depart.r.y);
    this.secteurs =
      this.dureeSecteur === null ? [] : [{ rang: 0, points: [this.depart.r.x, this.depart.r.y] }];
  }

  protected avancerSysteme(duree: number): ResultatImage<FinMode1> {
    const trace = this.trace;
    const seuil = this.seuilTrace;
    return avancerMode1(this.systeme, duree, this.elements.energie, (s) => {
      const { r } = etatAstre(s);
      trace.ajouterSiEloigne(r.x, r.y, seuil);
      this.echantillonnerSecteur(s.t, r.x, r.y, seuil);
    });
  }

  protected mesurerEcart(): number {
    return ecartEnergie(this.astre, this.depart);
  }

  protected terminerTraces(): void {
    const { r } = this.astre;
    this.trace.ajouter(r.x, r.y);
  }

  /** Ajoute la position courante au secteur de la loi des aires correspondant au temps t. */
  private echantillonnerSecteur(t: number, x: number, y: number, seuil: number): void {
    const duree = this.dureeSecteur;
    const courant = this.secteurs[this.secteurs.length - 1];
    if (duree === null || !courant) return;
    const rang = Math.floor(t / duree);
    if (rang !== courant.rang) {
      // Frontière franchie : le point clôt le secteur courant et ouvre le suivant.
      courant.points.push(x, y);
      this.secteurs = [...this.secteurs, { rang, points: [x, y] }].slice(-(SECTEURS_CONSERVES + 1));
      return;
    }
    const n = courant.points.length;
    const dx = x - (courant.points[n - 2] ?? x);
    const dy = y - (courant.points[n - 1] ?? y);
    if (Math.hypot(dx, dy) >= seuil) courant.points.push(x, y);
  }
}
