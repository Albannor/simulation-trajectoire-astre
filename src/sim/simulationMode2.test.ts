import { describe, expect, it } from 'vitest';
import { presetMode2 } from '../physics/presets';
import { type ReglagesMode2, grandeursMode2 } from '../physics/mode2';
import { norm } from '../physics/vec2';
import { SimulationMode2 } from './simulationMode2';
import { TraceDuo } from './traceDuo';

const DERIVE: ReglagesMode2 = {
  a: { masse: 2, r: { x: 0, y: -0.83 }, v: { x: 2.31, y: -1.15 } },
  b: { masse: 1, r: { x: 0, y: 1.65 }, v: { x: -4, y: 2.31 } },
};

describe('SimulationMode2', () => {
  it('lancer, avancer, contact et recommencer', () => {
    const chute: ReglagesMode2 = {
      a: { masse: 1, r: { x: -1, y: 0 }, v: { x: 0, y: 0 } },
      b: { masse: 1, r: { x: 1, y: 0 }, v: { x: 0, y: 0 } },
    };
    const sim = new SimulationMode2(chute, 100);
    expect(sim.lies).toBe(true);
    sim.lancer();
    for (let k = 0; k < 200 && sim.etat === 'enCours'; k++) sim.avancer(1 / 60);
    expect(sim.etat).toBe('terminee');
    expect(sim.fin).toBe('contact');
    sim.basculer();
    expect(sim.etat).toBe('edition');
    expect(sim.temps).toBe(0);
  });

  it('dérive détectée ; « Annuler la dérive » ramène V_cm à 0 au lancement', () => {
    const sim = new SimulationMode2(DERIVE, 1);
    expect(sim.derive).toBe(true);
    sim.definirAnnulerDerive(true);
    expect(sim.derive).toBe(true); // rien ne change avant le lancement
    sim.lancer();
    expect(sim.derive).toBe(false);
    const g = grandeursMode2(sim.reglages.a, sim.reglages.b);
    expect(norm(g.vCm)).toBeLessThan(1e-12);
  });

  it('sans l’option, la dérive est conservée', () => {
    const sim = new SimulationMode2(DERIVE, 1);
    sim.lancer();
    expect(sim.derive).toBe(true);
  });

  it('traces de A et B enregistrées ensemble ; anciennes traces conservées', () => {
    const sim = new SimulationMode2(presetMode2('massesEgales', DERIVE), 10);
    sim.lancer();
    sim.avancer(0.1);
    expect(sim.trace.longueur).toBeGreaterThan(10);
    sim.recommencer();
    sim.lancer();
    expect(sim.anciennesTraces).toHaveLength(1);
    sim.avancer(0.1);
    // Chaque trace garde les masses de son époque (origine du point de vue « centre de masse »).
    sim.modifierReglages({ ...sim.reglages, a: { ...sim.reglages.a, masse: 4 } });
    sim.lancer();
    expect(sim.trace.masses).toEqual([4, 1]);
    expect(sim.anciennesTraces.at(-1)!.masses).toEqual([1, 1]);
    sim.effacerTraces();
    expect(sim.anciennesTraces).toHaveLength(0);
  });

  it('précision correcte sur un tour', () => {
    const sim = new SimulationMode2(presetMode2('grosEtPetit', DERIVE), 10);
    sim.lancer();
    for (let k = 0; k < 120; k++) sim.avancer(1 / 60);
    expect(sim.precisionCorrecte).toBe(true);
  });
});

describe('TraceDuo', () => {
  it('ordre, écrasement et échantillonnage', () => {
    const t = new TraceDuo(2);
    t.ajouter(1, 1, 2, 2);
    expect(t.ajouterSiEloigne(1.01, 1, 2, 2, 0.1)).toBe(false);
    expect(t.ajouterSiEloigne(1, 1, 2.5, 2, 0.1)).toBe(true);
    t.ajouter(3, 3, 4, 4);
    const releves: number[][] = [];
    t.parcourir((...v) => releves.push(v));
    expect(releves).toEqual([
      [1, 1, 2.5, 2, 0],
      [3, 3, 4, 4, 1],
    ]);
    t.vider();
    expect(t.longueur).toBe(0);
  });
});
