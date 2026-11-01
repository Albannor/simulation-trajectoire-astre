import { describe, expect, it } from 'vitest';
import { R0_MAX, R0_MIN, V0_MAX } from '../config';
import { degToRad } from './constants';
import { vCirc, vLib } from './kepler';
import {
  type ReglagesMode1,
  appliquerAimant,
  etatInitialMode1,
  reglagesDepuisFleche,
  reglagesDepuisPosition,
} from './mode1';

const REG: ReglagesMode1 = { r0: 1, v0: 5, theta: degToRad(70), sens: 1, phi0: 0 };

describe('glisser l’astre (F-M1-2)', () => {
  it('position → r₀ et φ₀', () => {
    const r = reglagesDepuisPosition(REG, 0, 2);
    expect(r.r0).toBeCloseTo(2, 12);
    expect(r.phi0).toBeCloseTo(Math.PI / 2, 12);
    expect(r.v0).toBe(REG.v0);
  });
  it('distance bornée', () => {
    expect(reglagesDepuisPosition(REG, 0.01, 0).r0).toBe(R0_MIN);
    expect(reglagesDepuisPosition(REG, -30, 0).r0).toBe(R0_MAX);
    expect(reglagesDepuisPosition(REG, 0, 0).phi0).toBe(REG.phi0);
  });
});

describe('tirer la flèche (F-M1-2)', () => {
  it('vecteur → v₀, θ et sens ; aller-retour avec etatInitialMode1', () => {
    for (const [vx, vy] of [
      [1, 4],
      [-3, -2],
      [2, -5],
    ] as const) {
      const reg = reglagesDepuisFleche({ ...REG, phi0: 0.7 }, vx, vy);
      const { v } = etatInitialMode1(reg);
      expect(v.x).toBeCloseTo(vx, 12);
      expect(v.y).toBeCloseTo(vy, 12);
    }
  });
  it('sens : flèche à gauche du rayon → anti-horaire, à droite → horaire', () => {
    expect(reglagesDepuisFleche(REG, 0, 3).sens).toBe(1);
    expect(reglagesDepuisFleche(REG, 0, -3).sens).toBe(-1);
  });
  it('flèche radiale : sens conservé ; vitesse bornée', () => {
    expect(reglagesDepuisFleche({ ...REG, sens: -1 }, 2, 0).sens).toBe(-1);
    expect(reglagesDepuisFleche(REG, -20, 0)).toMatchObject({ v0: V0_MAX, theta: Math.PI });
  });
});

describe('aimant (F-M1-3, D-22)', () => {
  it('cale la vitesse sur v_circ ou v_lib à moins de 3 %', () => {
    expect(appliquerAimant({ ...REG, r0: 2, v0: vCirc(2) * 1.025 }).v0).toBe(vCirc(2));
    expect(appliquerAimant({ ...REG, r0: 2, v0: vLib(2) * 0.975 }).v0).toBe(vLib(2));
    expect(appliquerAimant({ ...REG, r0: 2, v0: vCirc(2) * 1.04 }).v0).toBe(vCirc(2) * 1.04);
  });
  it('cale θ sur 90° à moins de 3°', () => {
    expect(appliquerAimant({ ...REG, theta: degToRad(92.5) }).theta).toBe(Math.PI / 2);
    expect(appliquerAimant({ ...REG, theta: degToRad(86) }).theta).toBe(degToRad(86));
  });
});
