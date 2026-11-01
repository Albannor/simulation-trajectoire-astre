/**
 * Socle commun des simulations (hors de React, § 8.3) : machine d'états (F-APP-4), vitesse du
 * temps, pas à pas, fins de simulation, indicateurs « ralentie » et « précision ». Chaque mode
 * fournit son système, ses traces et sa mesure de précision.
 */

import { DT_REEL_MAX, DUREE_PAS_REEL, SEUIL_PRECISION, TEMPS_X1 } from '../config';
import { type ResultatImage } from '../physics/integrator';
import { type SystemeNCorps } from '../physics/nbody';
import { type EtatSimulation, actionPrincipale, transition } from './etats';
import { Observable } from './observable';

export abstract class SimulationBase<R, F extends string> extends Observable {
  protected reglagesCourants: R;
  private multiplicateurCourant: number;
  private etatCourant: EtatSimulation = 'edition';

  systeme!: SystemeNCorps;
  ralenti = false;
  fin: F | null = null;
  ecartEnergie = 0;
  /** Distance minimale entre deux points de trace (UA), fixée par la vue selon le zoom. */
  seuilTrace = 0.005;

  /**
   * Les sous-classes appellent `reinitialiser()` à la fin de leur constructeur (leurs champs ne
   * sont initialisés qu'après celui-ci).
   */
  constructor(reglages: R, multiplicateur: number) {
    super();
    this.reglagesCourants = reglages;
    this.multiplicateurCourant = multiplicateur;
  }

  // ——— À fournir par chaque mode ———

  /** Recalcule tout ce qui dépend des réglages et remet le système à t = 0. */
  protected abstract reinitialiser(): void;
  /** Archive la trace précédente et en commence une nouvelle (F-APP-5). */
  protected abstract demarrerTrace(): void;
  /** Avance le système d'une durée simulée (an), en échantillonnant les traces au sous-pas. */
  protected abstract avancerSysteme(duree: number): ResultatImage<F>;
  /** Écart d'énergie pour l'indicateur de précision (D-03). */
  protected abstract mesurerEcart(): number;
  /** Ajoute la position finale aux traces (fin de simulation). */
  protected abstract terminerTraces(): void;
  abstract effacerTraces(): void;
  /** Point d'entrée avant un lancement depuis Édition (ex. « Annuler la dérive »). */
  protected preparerLancement(): void {}

  // ——— Lecture ———

  get reglages(): R {
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

  get precisionCorrecte(): boolean {
    return this.ecartEnergie < SEUIL_PRECISION;
  }

  // ——— Commandes ———

  modifierReglages(reglages: R): void {
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
    if (this.etatCourant === 'edition') this.commencer();
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
    if (this.etatCourant === 'edition') this.commencer();
    this.etatCourant = transition(this.etatCourant, 'pas');
    this.integrer(DUREE_PAS_REEL);
    this.notifier();
  }

  recommencer(): void {
    this.reinitialiser();
    this.etatCourant = transition(this.etatCourant, 'recommencer');
    this.notifier();
  }

  /** Appelé à chaque image avec le temps réel écoulé (s). */
  avancer(dtReel: number): void {
    if (this.etatCourant !== 'enCours') return;
    this.integrer(Math.min(Math.max(dtReel, 0), DT_REEL_MAX));
  }

  /** Réinitialise sans changer d'état (usage interne des sous-classes). */
  protected reinitialiserSansTransition(): void {
    this.reinitialiser();
  }

  // ——— Interne ———

  private commencer(): void {
    this.preparerLancement();
    this.demarrerTrace();
  }

  private integrer(dtReel: number): void {
    const res = this.avancerSysteme(TEMPS_X1 * this.multiplicateurCourant * dtReel);
    this.systeme = res.systeme;
    this.ralenti = res.ralenti;
    this.ecartEnergie = this.mesurerEcart();
    if (res.evenement) {
      this.terminerTraces();
      this.fin = res.evenement;
      this.etatCourant = transition(this.etatCourant, 'terminer');
      this.notifier();
    }
  }
}
