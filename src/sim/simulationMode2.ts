/** Simulation du mode 2 (deux corps), hors de React. */

import { NB_ANCIENNES_TRACES, TRAINEE_MAX, V_CM_NULLE } from '../config';
import { type ResultatImage } from '../physics/integrator';
import { type Classification, type OrbitElements, classifier, elements } from '../physics/kepler';
import { ecartEnergie } from '../physics/mode1';
import {
  type FinMode2,
  type GrandeursMode2,
  type ReglagesMode2,
  annulerDerive,
  avancerMode2,
  corpsDuSysteme,
  creerSystemeMode2,
  grandeursMode2,
} from '../physics/mode2';
import { norm } from '../physics/vec2';
import { SimulationBase } from './simulationBase';
import { TraceDuo } from './traceDuo';

export class SimulationMode2 extends SimulationBase<ReglagesMode2, FinMode2> {
  /** Grandeurs de l'état de départ (§ 5.5). */
  grandeurs!: GrandeursMode2;
  /** Orbite relative (formules du § 5.2 avec μ_rel). */
  elementsRelatifs!: OrbitElements;
  classificationRelative!: Classification;
  trace = new TraceDuo(TRAINEE_MAX);
  anciennesTraces: TraceDuo[] = [];
  /** « Annuler la dérive » (§ 11 point 4) : V_cm ramenée à 0 au lancement. */
  private deriveAnnulee = false;

  constructor(reglages: ReglagesMode2, multiplicateur: number) {
    super(reglages, multiplicateur);
    this.reinitialiser();
  }

  /** Corps à l'instant courant. */
  get corps(): ReglagesMode2 {
    return corpsDuSysteme(this.systeme);
  }

  /** Corps liés ⇔ ε_rel < 0 (§ 5.5). */
  get lies(): boolean {
    return this.elementsRelatifs.energie < 0;
  }

  /** Vitesse du centre de masse non nulle : le système dérive en vue fixe (§ 5.6). */
  get derive(): boolean {
    return norm(this.grandeurs.vCm) > V_CM_NULLE;
  }

  get annulerDerive(): boolean {
    return this.deriveAnnulee;
  }

  definirAnnulerDerive(actif: boolean): void {
    this.deriveAnnulee = actif;
    this.notifier();
  }

  effacerTraces(): void {
    this.anciennesTraces = [];
    this.trace.vider();
    this.notifier();
  }

  protected reinitialiser(): void {
    const { a, b } = this.reglagesCourants;
    this.grandeurs = grandeursMode2(a, b);
    this.elementsRelatifs = elements(this.grandeurs.relatif, this.grandeurs.mu);
    this.classificationRelative = classifier(this.grandeurs.relatif, this.grandeurs.mu);
    this.systeme = creerSystemeMode2(this.reglagesCourants);
    this.fin = null;
    this.ralenti = false;
    this.ecartEnergie = 0;
  }

  protected override preparerLancement(): void {
    if (this.deriveAnnulee && this.derive) {
      this.reglagesCourants = annulerDerive(this.reglagesCourants);
      this.reinitialiserSansTransition();
    }
  }

  protected demarrerTrace(): void {
    if (this.trace.longueur > 1) {
      this.anciennesTraces = [...this.anciennesTraces, this.trace].slice(-NB_ANCIENNES_TRACES);
      this.trace = new TraceDuo(TRAINEE_MAX);
    } else {
      this.trace.vider();
    }
    const { a, b } = this.reglagesCourants;
    this.trace.masses = [a.masse, b.masse];
    this.trace.ajouter(a.r.x, a.r.y, b.r.x, b.r.y);
  }

  protected avancerSysteme(duree: number): ResultatImage<FinMode2> {
    const trace = this.trace;
    const seuil = this.seuilTrace;
    return avancerMode2(this.systeme, duree, this.elementsRelatifs.energie, (s) => {
      const { a, b } = corpsDuSysteme(s);
      trace.ajouterSiEloigne(a.r.x, a.r.y, b.r.x, b.r.y, seuil);
    });
  }

  protected mesurerEcart(): number {
    const { a, b } = this.corps;
    return ecartEnergie(grandeursMode2(a, b).relatif, this.grandeurs.relatif, this.grandeurs.mu);
  }

  protected terminerTraces(): void {
    const { a, b } = this.corps;
    this.trace.ajouter(a.r.x, a.r.y, b.r.x, b.r.y);
  }
}
