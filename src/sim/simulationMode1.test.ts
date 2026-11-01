import { describe, expect, it } from 'vitest';
import { NB_ANCIENNES_TRACES, TEMPS_X1 } from '../config';
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
