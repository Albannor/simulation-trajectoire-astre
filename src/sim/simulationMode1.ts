/**
 * État de la simulation du mode 1, hors de React (§ 8.3). Les composants s'abonnent aux
 * changements discrets (état, réglages, vitesse du temps) ; les mesures continues sont lues
 * à MESURES_HZ par les composants qui les affichent.
 */

import {
  DT_REEL_MAX,
  DUREE_PAS_REEL,
  NB_ANCIENNES_TRACES,
  SECTEURS_CONSERVES,
  SECTEURS_PAR_PERIODE,
  SEUIL_PRECISION,
  TEMPS_X1,
  TRAINEE_MAX,
} from '../config';
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
import { type SystemeNCorps } from '../physics/nbody';
import { type EtatSimulation, actionPrincipale, transition } from './etats';
import { Observable } from './observable';
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

export class SimulationMode1 extends Observable {
  private reglagesCourants: ReglagesMode1;
  private multiplicateurCourant: number;
  private etatCourant: EtatSimulation = 'edition';

  depart!: BodyState;
  elements!: OrbitElements;
  classification!: Classification;
  systeme!: SystemeNCorps;
  trace = new Trace(TRAINEE_MAX);
  /** Forme de la trace en cours. */
  formeTrace: FormeTrace = 'ellipse';
  anciennesTraces: TraceArchivee[] = [];
  ralenti = false;
  fin: FinMode1 | null = null;
  ecartEnergie = 0;
  /** Distance minimale entre deux points de trace (UA), fixée par la vue selon le zoom. */
  seuilTrace = 0.005;

  /** Secteurs de la loi des aires (F-M1-8) : les derniers terminés puis celui en cours. */
  secteurs: Secteur[] = [];
  dureeSecteur: number | null = null;

  constructor(reglages: ReglagesMode1, multiplicateur: number) {
    super();
    this.reglagesCourants = reglages;
    this.multiplicateurCourant = multiplicateur;
    this.reinitialiser();
  }

  // ——— Lecture ———

  get reglages(): ReglagesMode1 {
    return this.reglagesCourants;
  }

  get multiplicateur(): number {
    return this.multiplicateurCourant;
  }

  get etat(): EtatSimulation {
    return this.etatCourant;
  }

  get temps(): number {
    return this.systeme.t;
  }

  get astre(): BodyState {
    return etatAstre(this.systeme);
  }

  get precisionCorrecte(): boolean {
    return this.ecartEnergie < SEUIL_PRECISION;
  }

  // ——— Commandes ———

  modifierReglages(reglages: ReglagesMode1): void {
    this.reglagesCourants = reglages;
    this.reinitialiser();
    this.etatCourant = transition(this.etatCourant, 'modifier');
    this.notifier();
  }

  definirMultiplicateur(multiplicateur: number): void {
    this.multiplicateurCourant = multiplicateur;
    this.notifier();
  }

  /** Bouton principal : Lancer / Pause / Recommencer selon l'état. */
  basculer(): void {
    const action = actionPrincipale(this.etatCourant);
    if (action === 'lancer') this.lancer();
    else if (action === 'pause') this.pause();
    else this.recommencer();
  }

  lancer(): void {
    if (this.etatCourant === 'edition') this.demarrerTrace();
    this.etatCourant = transition(this.etatCourant, 'lancer');
    this.notifier();
  }

  pause(): void {
    this.etatCourant = transition(this.etatCourant, 'pause');
    this.notifier();
  }

  /** Avance d'un pas (≈ 1/60 s à la vitesse courante) et met en pause (F-SIM-1, D-19). */
  pas(): void {
    if (this.etatCourant === 'terminee') return;
    if (this.etatCourant === 'edition') this.demarrerTrace();
    this.etatCourant = transition(this.etatCourant, 'pas');
    this.integrer(DUREE_PAS_REEL);
    this.notifier();
  }

  recommencer(): void {
    this.reinitialiser();
    this.etatCourant = transition(this.etatCourant, 'recommencer');
    this.notifier();
  }

  effacerTraces(): void {
    this.anciennesTraces = [];
    this.trace.vider();
    this.notifier();
  }

  /** Appelé à chaque image avec le temps réel écoulé (s). */
  avancer(dtReel: number): void {
    if (this.etatCourant !== 'enCours') return;
    this.integrer(Math.min(Math.max(dtReel, 0), DT_REEL_MAX));
  }

  // ——— Interne ———

  private reinitialiser(): void {
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

  /** Archive la trace précédente (atténuée, F-APP-5) et commence une nouvelle trace. */
  private demarrerTrace(): void {
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

  private integrer(dtReel: number): void {
    const duree = TEMPS_X1 * this.multiplicateurCourant * dtReel;
    const trace = this.trace;
    const seuil = this.seuilTrace;
    const res = avancerMode1(this.systeme, duree, this.elements.energie, (s) => {
      const { r } = etatAstre(s);
      trace.ajouterSiEloigne(r.x, r.y, seuil);
      this.echantillonnerSecteur(s.t, r.x, r.y, seuil);
    });
    this.systeme = res.systeme;
    this.ralenti = res.ralenti;
    this.ecartEnergie = ecartEnergie(this.astre, this.depart);
    if (res.evenement) {
      const { r } = this.astre;
      trace.ajouter(r.x, r.y);
      this.fin = res.evenement;
      this.etatCourant = transition(this.etatCourant, 'terminer');
      this.notifier();
    }
  }
}
