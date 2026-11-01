import { describe, expect, it } from 'vitest';
import { NB_ANCIENNES_TRACES, TEMPS_X1 } from '../config';
import { degToRad } from '../physics/constants';
import { aireBalayee } from '../physics/kepler';
import { presetMode1 } from '../physics/presets';
import { type ReglagesMode1 } from '../physics/mode1';
import { SimulationMode1 } from './simulationMode1';

const TERRE = presetMode1('terre', { r0: 1, v0: 1, theta: 1, sens: 1, phi0: 0 });

describe('SimulationMode1', () => {
  it('lancer, avancer, pause, recommencer', () => {
    const sim = new SimulationMode1(TERRE, 1);
    let notifications = 0;
    sim.abonner(() => notifications++);
    sim.avancer(0.5);
    expect(sim.temps).toBe(0); // en édition, rien ne bouge
    sim.basculer();
    expect(sim.etat).toBe('enCours');
    sim.avancer(1 / 60);
    expect(sim.temps).toBeCloseTo(TEMPS_X1 / 60, 12);
    sim.basculer();
    expect(sim.etat).toBe('pause');
    sim.avancer(1);
    expect(sim.temps).toBeCloseTo(TEMPS_X1 / 60, 12);
    sim.recommencer();
    expect(sim.etat).toBe('edition');
    expect(sim.temps).toBe(0);
    expect(notifications).toBe(3);
  });

  it('le temps réel est plafonné (D-18)', () => {
    const sim = new SimulationMode1(TERRE, 1);
    sim.lancer();
    sim.avancer(30);
    expect(sim.temps).toBeCloseTo(TEMPS_X1 * 0.1, 12);
  });

  it('pas à pas depuis Édition : lance puis pause (D-19)', () => {
    const sim = new SimulationMode1(TERRE, 100);
    sim.pas();
    expect(sim.etat).toBe('pause');
    expect(sim.temps).toBeCloseTo((TEMPS_X1 * 100) / 60, 12);
    expect(sim.trace.longueur).toBeGreaterThan(10);
  });

  it('modifier un réglage ramène à Édition (F-APP-4)', () => {
    const sim = new SimulationMode1(TERRE, 1);
    sim.lancer();
    sim.avancer(0.05);
    sim.modifierReglages({ ...TERRE, v0: 7 });
    expect(sim.etat).toBe('edition');
    expect(sim.temps).toBe(0);
    expect(sim.classification).toMatchObject({ forme: 'ellipse' });
  });

  it('collision : état Terminée, puis le bouton principal recommence', () => {
    const chute: ReglagesMode1 = { ...TERRE, v0: 0.5 };
    const sim = new SimulationMode1(chute, 100);
    sim.lancer();
    for (let k = 0; k < 100 && sim.etat === 'enCours'; k++) sim.avancer(1 / 60);
    expect(sim.etat).toBe('terminee');
    expect(sim.fin).toBe('collision');
    sim.basculer();
    expect(sim.etat).toBe('edition');
    expect(sim.fin).toBeNull();
  });

  it('anciennes traces : au plus NB_ANCIENNES_TRACES, effaçables (F-APP-5)', () => {
    const sim = new SimulationMode1(TERRE, 10);
    for (let k = 0; k < NB_ANCIENNES_TRACES + 2; k++) {
      sim.lancer();
      sim.avancer(0.05);
      sim.recommencer();
    }
    sim.lancer();
    expect(sim.anciennesTraces).toHaveLength(NB_ANCIENNES_TRACES);
    expect(sim.anciennesTraces[0]!.forme).toBe('cercle');
    sim.effacerTraces();
    expect(sim.anciennesTraces).toHaveLength(0);
    expect(sim.trace.longueur).toBe(0);
  });

  it('vitesse du temps et précision', () => {
    const sim = new SimulationMode1(TERRE, 1);
    sim.definirMultiplicateur(100);
    expect(sim.multiplicateur).toBe(100);
    sim.lancer();
    sim.avancer(0.1);
    expect(sim.precisionCorrecte).toBe(true);
    expect(sim.ralenti).toBe(false);
  });
});

/** Aire d’un secteur : polygone Soleil (origine) + points balayés (formule du lacet). */
function aireSecteur(points: number[]): number {
  let a = 0;
  for (let k = 0; k + 3 < points.length; k += 2) {
    a += points[k]! * points[k + 3]! - points[k + 2]! * points[k + 1]!;
  }
  return Math.abs(a) / 2;
}

describe('loi des aires (F-M1-8)', () => {
  it.each([1, 10, 100])('×%d : secteurs d’aires égales à |h|·Δt/2, 6 conservés', (k) => {
    const sim = new SimulationMode1(
      { r0: 0.81, v0: 8.43, theta: degToRad(64), sens: 1, phi0: 0 },
      k,
    );
    sim.seuilTrace = 0.002;
    sim.lancer();
    // 1,5 période, images de 1/60 s.
    const nImages = Math.ceil((1.5 * sim.elements.periode!) / ((TEMPS_X1 * k) / 60));
    for (let i = 0; i < nImages; i++) sim.avancer(1 / 60);
    const termines = sim.secteurs.slice(0, -1);
    expect(termines).toHaveLength(6);
    const attendu = aireBalayee(sim.elements.h, sim.dureeSecteur!);
    const ecarts = termines.map((sec) => Math.abs(aireSecteur(sec.points) / attendu - 1));
    // Écart mesuré (2026-11-01) : 0,40 % (×1) ; 0,63 % (×10) ; 0,21 % (×100). Il vient des cordes
    // (points espacés de 0,002 UA) et des frontières placées au sous-pas. Tolérance 2 % : un écart
    // invisible à l’écran, la loi elle-même étant exacte (T-07 : h conservé à 1e-12).
    expect(Math.max(...ecarts)).toBeLessThan(0.02);
    // Rangs consécutifs : l’alternance des couleurs est continue.
    termines.forEach((sec, i) => i > 0 && expect(sec.rang).toBe(termines[i - 1]!.rang + 1));
  });

  it('pas de secteurs pour une trajectoire droite', () => {
    const sim = new SimulationMode1({ ...TERRE, theta: 0, v0: 3 }, 1);
    sim.lancer();
    sim.avancer(0.05);
    expect(sim.secteurs).toHaveLength(0);
  });
});
