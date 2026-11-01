/**
 * État de la simulation du mode 1, hors de React (§ 8.3). Les composants s'abonnent aux
 * changements discrets (état, réglages, vitesse du temps) ; les mesures continues sont lues
 * à MESURES_HZ par les composants qui les affichent.
 */

import {
  DT_REEL_MAX,
  DUREE_PAS_REEL,
  NB_ANCIENNES_TRACES,
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

export class SimulationMode1 {
  private reglagesCourants: ReglagesMode1;
  private multiplicateurCourant: number;
  private etatCourant: EtatSimulation = 'edition';
  private ecouteurs = new Set<() => void>();
  /** Incrémenté à chaque changement discret (instantané pour useSyncExternalStore). */
  private versionCourante = 0;

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

  constructor(reglages: ReglagesMode1, multiplicateur: number) {
    this.reglagesCourants = reglages;
    this.multiplicateurCourant = multiplicateur;
    this.reinitialiser();
  }

  // ——— Abonnement ———

  abonner = (ecouteur: () => void): (() => void) => {
    this.ecouteurs.add(ecouteur);
    return () => this.ecouteurs.delete(ecouteur);
  };

  version = (): number => this.versionCourante;

  private notifier(): void {
    this.versionCourante++;
    this.ecouteurs.forEach((f) => f());
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
  }

  private integrer(dtReel: number): void {
    const duree = TEMPS_X1 * this.multiplicateurCourant * dtReel;
    const trace = this.trace;
    const seuil = this.seuilTrace;
    const res = avancerMode1(this.systeme, duree, this.elements.energie, (s) => {
      const { r } = etatAstre(s);
      trace.ajouterSiEloigne(r.x, r.y, seuil);
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
