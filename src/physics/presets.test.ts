import { describe, expect, it } from 'vitest';
import { degToRad, radToDeg } from './constants';
import { classifier, elements, vLib } from './kepler';
import { type ReglagesMode1, etatInitialMode1 } from './mode1';
import { presetMode1 } from './presets';

const courant: ReglagesMode1 = { r0: 2.5, v0: 1, theta: 1, sens: -1, phi0: 0.8 };

/** Valeurs arrondies du tableau du § 6.5 (2 décimales ; angle entier). */
function arrondi(reg: ReglagesMode1) {
  return {
    r0: Number(reg.r0.toFixed(2)),
    v0: Number(reg.v0.toFixed(2)),
    theta: Math.round(radToDeg(reg.theta)),
  };
}

describe('préréglages du mode 1 (§ 6.5)', () => {
  it('Terre : r₀ = 1 ; v₀ = 6,28 ; θ = 90° ; cercle de période 1 an', () => {
    const reg = presetMode1('terre', courant);
    expect(arrondi(reg)).toEqual({ r0: 1, v0: 6.28, theta: 90 });
    const etat = etatInitialMode1(reg);
    expect(classifier(etat)).toMatchObject({ forme: 'cercle' });
    expect(elements(etat).periode).toBeCloseTo(1, 12);
  });

  it('Mars : départ à l’aphélie, r₀ = 1,67 ; v₀ = 4,63 ; θ = 90°', () => {
    const reg = presetMode1('mars', courant);
    expect(arrondi(reg)).toEqual({ r0: 1.67, v0: 4.63, theta: 90 });
    const el = elements(etatInitialMode1(reg));
    expect(el.a).toBeCloseTo(1.52366231, 10);
    expect(el.e).toBeCloseTo(0.09341233, 10);
    // Départ à l'aphélie, à gauche du Soleil (périhélie à droite).
    expect(Math.cos(reg.phi0)).toBeCloseTo(-1, 12);
  });

  it('Halley : r₀ = 0,59 ; v₀ = 11,47 ; θ = 90° ; a ≈ 17,9 UA ; T ≈ 75,6 ans', () => {
    const reg = presetMode1('halley', courant);
    expect(arrondi(reg)).toEqual({ r0: 0.59, v0: 11.47, theta: 90 });
    const el = elements(etatInitialMode1(reg));
    expect(el.a).toBeCloseTo(17.88, 2);
    expect(el.periode).toBeCloseTo(75.6, 1);
    // § 11, point 5 : proche de la vitesse de libération (11,57).
    expect(vLib(0.59)).toBeCloseTo(11.57, 2);
  });

  it('Comète hyperbolique : r₀ = 3,99 ; v₀ = 6,79 ; θ = 159° ; e = 1,6 ; rp = 0,9 ; |a| = 1,5', () => {
    const reg = presetMode1('cometeHyperbolique', courant);
    expect(arrondi(reg)).toEqual({ r0: 3.99, v0: 6.79, theta: 159 });
    const el = elements(etatInitialMode1(reg));
    expect(el.e).toBeCloseTo(1.6, 12);
    expect(el.rp).toBeCloseTo(0.9, 12);
    expect(el.a).toBeCloseTo(-1.5, 12);
    expect(radToDeg(reg.phi0)).toBeCloseTo(-105, 10);
  });

  it('Parabole : r₀ = 1 ; v₀ = 8,89 ; θ = 90°, parabole exacte', () => {
    const reg = presetMode1('parabole', courant);
    expect(arrondi(reg)).toEqual({ r0: 1, v0: 8.89, theta: 90 });
    expect(classifier(etatInitialMode1(reg))).toEqual({
      type: 'conique',
      forme: 'parabole',
      presque: false,
      collision: false,
    });
  });

  it('Orbite circulaire : conserve r₀, le sens et φ₀ ; v₀ = 2π/√r₀ ; θ = 90°', () => {
    const reg = presetMode1('orbiteCirculaire', courant);
    expect(reg.r0).toBeCloseTo(courant.r0, 12);
    expect(reg.v0).toBeCloseTo((2 * Math.PI) / Math.sqrt(courant.r0), 12);
    expect(reg.theta).toBeCloseTo(degToRad(90), 12);
    expect(reg.sens).toBe(-1);
    expect(reg.phi0).toBeCloseTo(courant.phi0, 12);
    expect(classifier(etatInitialMode1(reg))).toMatchObject({ forme: 'cercle' });
  });
});
