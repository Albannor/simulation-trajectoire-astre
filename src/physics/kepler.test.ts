import { describe, expect, it } from 'vitest';
import { R_COLLISION, TOL_PARABOLE } from '../config';
import { MU_SOLEIL, degToRad, radToDeg } from './constants';
import {
  type BodyState,
  aireBalayee,
  anomalieVraie,
  asymptotes,
  classifier,
  distanceMinEstimee,
  dureeSecteur,
  echantillonnerConique,
  elements,
  etatDepuisElements,
  foyerVide,
  parametreDepuisPeriapse,
  pointConique,
  positionJauge,
  rayonMaxRadial,
  vCirc,
  vLib,
} from './kepler';
import { etatInitialMode1, reglagesDepuisEtat } from './mode1';
import { norm } from './vec2';

const lancer = (r0: number, v0: number, thetaDeg: number, sens: 1 | -1 = 1, phi0 = 0): BodyState =>
  etatInitialMode1({ r0, v0, theta: degToRad(thetaDeg), sens, phi0 });

describe('T-01 Terre', () => {
  it('la formule √(1 + 2εh²/μ²) perdrait la précision près du cercle (D-16)', () => {
    const { energie, h } = elements(lancer(1, 2 * Math.PI, 90));
    const eFormule = Math.sqrt(Math.max(0, 1 + (2 * energie * h * h) / MU_SOLEIL ** 2));
    expect(eFormule).toBeGreaterThan(1e-9);
  });
  const etat = lancer(1, 2 * Math.PI, 90);
  const el = elements(etat);
  it('e < 1e-9, cercle, T = 1 an', () => {
    expect(el.e).toBeLessThan(1e-9);
    expect(classifier(etat)).toEqual({
      type: 'conique',
      forme: 'cercle',
      presque: false,
      collision: false,
    });
    expect(el.periode).toBeCloseTo(1, 12);
    expect(el.a).toBeCloseTo(1, 12);
  });
  it('cercle : direction du périhélie = direction du départ (D-14)', () => {
    expect(elements(lancer(1, 2 * Math.PI, 90, 1, 2)).omega).toBeCloseTo(2, 12);
  });
});

describe('T-03 ellipse de la maquette (r₀ = 0,81 ; v₀ = 8,43 ; θ = 64°)', () => {
  const etat = lancer(0.81, 8.43, 64);
  const el = elements(etat);
  it('e ≈ 0,60 ; a ≈ 1,50 ; T ≈ 1,84 ; rp ≈ 0,60 ; ra ≈ 2,40', () => {
    expect(Math.abs(el.e - 0.6)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(el.a - 1.5)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(el.periode! - 1.84)).toBeLessThanOrEqual(0.05);
    // « ≈ » sans tolérance dans la spécification : affichage à 2 décimales (0,60 et 2,39 mesurés
    // 0,5958 et 2,3936 — la maquette affiche 2,40) ; tolérance retenue ± 0,01.
    expect(Math.abs(el.rp - 0.6)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(el.ra! - 2.4)).toBeLessThanOrEqual(0.01);
    expect(classifier(etat)).toMatchObject({ type: 'conique', forme: 'ellipse' });
  });
  it('grandeurs dérivées cohérentes : b, c, T = a^(3/2)', () => {
    expect(el.b).toBeCloseTo(el.a * Math.sqrt(1 - el.e ** 2), 12);
    expect(el.c).toBeCloseTo(el.a * el.e, 12);
    expect(el.periode).toBeCloseTo(el.a ** 1.5, 12);
    expect(el.rp).toBeCloseTo(el.a * (1 - el.e), 12);
    expect(el.ra).toBeCloseTo(el.a * (1 + el.e), 12);
    expect(el.vInfini).toBeNull();
    expect(el.deviation).toBeNull();
  });
});

describe('T-04 hyperbole de la maquette (r₀ = 3,99 ; v₀ = 6,79 ; θ = 159°)', () => {
  const etat = lancer(3.99, 6.79, 159);
  const el = elements(etat);
  it('e ≈ 1,60 ; |a| ≈ 1,50 ; rp ≈ 0,90 ; v∞ ≈ 5,13 ; δ ≈ 77°', () => {
    // Valeurs mesurées depuis l'état arrondi (D-07) : e = 1,6098 ; rp = 0,9149 ; δ = 76,80°.
    expect(Math.abs(el.e - 1.6)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(Math.abs(el.a) - 1.5)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(el.rp - 0.9)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(el.vInfini! - 5.13)).toBeLessThanOrEqual(0.03);
    expect(Math.abs(radToDeg(el.deviation!) - 77)).toBeLessThanOrEqual(1);
    expect(el.a).toBeLessThan(0);
    expect(classifier(etat)).toMatchObject({
      type: 'conique',
      forme: 'hyperbole',
      collision: false,
    });
  });
  it('asymptotes : ν∞ = acos(−1/e), sans période ni aphélie', () => {
    expect(el.nuInfini).toBeCloseTo(Math.acos(-1 / el.e), 12);
    expect(el.periode).toBeNull();
    expect(el.ra).toBeNull();
    expect(el.rp).toBeCloseTo(Math.abs(el.a) * (el.e - 1), 12);
  });
});

describe('T-05 parabole', () => {
  it('v₀ = v_lib(r₀) → e = 1 ± 1e-9, parabole exacte', () => {
    for (const r0 of [0.3, 1, 2.7, 5]) {
      const etat = lancer(r0, vLib(r0), 90);
      const el = elements(etat);
      expect(Math.abs(el.e - 1)).toBeLessThan(1e-9);
      expect(classifier(etat)).toEqual({
        type: 'conique',
        forme: 'parabole',
        presque: false,
        collision: false,
      });
      // ε vaut ±1e-14 par arrondi : v∞ = √(2ε) est alors ~1e-7 ou sans objet. L'interface
      // affiche 0 pour une parabole (F-M1-6).
      expect(el.vInfini ?? 0).toBeLessThan(1e-6);
      expect(el.rp).toBeCloseTo(el.p / 2, 12);
    }
  });
  it('v₀ = v_lib × (1 ± 0,001) → encore « parabole », avec la mention « presque » (D-04)', () => {
    for (const k of [0.999, 1.001]) {
      const etat = lancer(1, vLib(1) * k, 90);
      expect(classifier(etat)).toEqual({
        type: 'conique',
        forme: 'parabole',
        presque: true,
        collision: false,
      });
    }
  });
  it('limites de la bande parabole (TOL_PARABOLE)', () => {
    // À θ = 90°, e − 1 ≈ 4·(v/v_lib − 1) (développement au 1er ordre).
    expect(classifier(lancer(1, vLib(1) * (1 + TOL_PARABOLE), 90))).toMatchObject({
      forme: 'hyperbole',
    });
    expect(classifier(lancer(1, vLib(1) * (1 - TOL_PARABOLE), 90))).toMatchObject({
      forme: 'ellipse',
    });
  });
  it('D-17 : chute lente (e ≈ 0,998) → ellipse, pas « parabole »', () => {
    const etat = lancer(1, 0.3, 90);
    expect(Math.abs(elements(etat).e - 1)).toBeLessThan(TOL_PARABOLE);
    expect(classifier(etat)).toMatchObject({ forme: 'ellipse', collision: true });
  });
  it('D-17 : départ quasi radial très rapide (e ≈ 1,001) → hyperbole, pas « parabole »', () => {
    const etat = lancer(1, 12, 1);
    expect(Math.abs(elements(etat).e - 1)).toBeLessThan(TOL_PARABOLE);
    expect(classifier(etat)).toMatchObject({ forme: 'hyperbole' });
  });
  it('D-17 : v = v_lib à θ quelconque → parabole', () => {
    for (const th of [20, 60, 130]) {
      expect(classifier(lancer(2, vLib(2), th))).toMatchObject({ forme: 'parabole' });
    }
  });
  it('vitesses repères : v_circ(1) = 2π, v_lib = √2·v_circ', () => {
    expect(vCirc(1)).toBeCloseTo(2 * Math.PI, 12);
    expect(vLib(4)).toBeCloseTo(Math.SQRT2 * Math.PI, 12);
  });
});

describe('T-06 trajectoire droite (D-01)', () => {
  it('θ = 180° : tombe droit sur le Soleil, quelle que soit l’énergie', () => {
    for (const v0 of [1, 6, 12]) {
      expect(classifier(lancer(1, v0, 180))).toEqual({
        type: 'droite',
        issue: 'tombe',
        collision: true,
      });
    }
  });
  it('v₀ = 0 : tombe droit', () => {
    expect(classifier(lancer(2, 0, 90))).toMatchObject({ type: 'droite', issue: 'tombe' });
  });
  it('θ = 0° et ε < 0 : monte puis retombe', () => {
    expect(classifier(lancer(1, 6, 0))).toEqual({
      type: 'droite',
      issue: 'retombe',
      collision: true,
    });
  });
  it('θ = 0° et ε ≥ 0 : part en ligne droite', () => {
    expect(classifier(lancer(1, 9, 0))).toEqual({
      type: 'droite',
      issue: 'part',
      collision: false,
    });
    expect(classifier(lancer(1, vLib(1), 0))).toMatchObject({ issue: 'part' });
  });
  it('hauteur maximale : r_max = −μ/ε, infinie si ε ≥ 0', () => {
    // Départ au repos à 2 UA : r_max = 2. Lancer vertical à v = v_circ(1) depuis 1 UA : r_max = 2.
    expect(rayonMaxRadial(lancer(2, 0, 90))).toBeCloseTo(2, 12);
    expect(rayonMaxRadial(lancer(1, vCirc(1), 0))).toBeCloseTo(2, 12);
    expect(rayonMaxRadial(lancer(1, 9, 0))).toBe(Infinity);
  });
  it('pas de jauge pour une trajectoire droite', () => {
    expect(positionJauge(classifier(lancer(1, 6, 0)), 1)).toBeNull();
  });
});

describe('T-14 (analytique) collision annoncée (D-02)', () => {
  it('ellipse dont le périhélie est sous R_COLLISION', () => {
    const etat = lancer(0.3, 3.6, 90);
    expect(elements(etat).rp).toBeLessThan(R_COLLISION);
    expect(classifier(etat)).toMatchObject({ forme: 'ellipse', collision: true });
  });
  it('chute lente (r₀ = 1, v₀ = 0,3) : collision annoncée', () => {
    expect(classifier(lancer(1, 0.3, 90))).toMatchObject({ collision: true });
  });
  it('ellipse qui s’éloigne d’abord : collision annoncée quand même (elle revient)', () => {
    const etat = lancer(1, 4, 2);
    expect(elements(etat).rp).toBeLessThan(R_COLLISION);
    expect(classifier(etat)).toMatchObject({ collision: true });
  });
  it('hyperbole qui s’éloigne déjà : périhélie dépassé, pas de collision', () => {
    const etat = lancer(1, 10, 10);
    expect(elements(etat).rp).toBeLessThan(R_COLLISION);
    expect(classifier(etat)).toMatchObject({ forme: 'hyperbole', collision: false });
  });
  it('hyperbole à l’approche : collision annoncée', () => {
    const etat = lancer(1, 10, 170);
    expect(classifier(etat)).toMatchObject({ forme: 'hyperbole', collision: true });
  });
});

describe('état ↔ éléments', () => {
  it.each([
    [0.5, 0.3, 1, 1],
    [2, 0.9, -2, -1],
    [1.2, 1, 1.5, 1],
    [2.34, 1.6, degToRad(-105), 1],
    [2.34, 1.6, 0.7, -1],
  ] as const)('p=%d e=%d ν=%d sens=%d : aller-retour', (p, e, nu, sens) => {
    const omega = 0.4;
    const etat = etatDepuisElements({ p, e, nu, omega, sens });
    const el = elements(etat);
    expect(el.p).toBeCloseTo(p, 10);
    expect(el.e).toBeCloseTo(e, 10);
    expect(el.sens).toBe(sens);
    expect(Math.cos(el.omega - omega)).toBeCloseTo(1, 10);
    expect(anomalieVraie(el, etat.r)).toBeCloseTo(nu, 10);
    const pt = pointConique(el, nu);
    expect(pt.x).toBeCloseTo(etat.r.x, 10);
    expect(pt.y).toBeCloseTo(etat.r.y, 10);
  });

  it('réglages ↔ état (sens horaire, φ₀ quelconque)', () => {
    const reg = { r0: 2.5, v0: 3.2, theta: degToRad(130), sens: -1 as const, phi0: -2.2 };
    const retour = reglagesDepuisEtat(etatInitialMode1(reg));
    expect(retour.r0).toBeCloseTo(reg.r0, 12);
    expect(retour.v0).toBeCloseTo(reg.v0, 12);
    expect(retour.theta).toBeCloseTo(reg.theta, 12);
    expect(retour.sens).toBe(-1);
    expect(retour.phi0).toBeCloseTo(reg.phi0, 12);
  });

  it('sens horaire : h < 0 et même forme qu’en sens anti-horaire', () => {
    const a = elements(lancer(0.81, 8.43, 64, 1));
    const b = elements(lancer(0.81, 8.43, 64, -1));
    expect(b.h).toBeCloseTo(-a.h, 12);
    expect(b.e).toBeCloseTo(a.e, 12);
    expect(b.sens).toBe(-1);
  });

  it('p = rp·(1 + e)', () => {
    expect(parametreDepuisPeriapse(0.9, 1.6)).toBeCloseTo(2.34, 12);
  });
});

describe('trajectoire prévue (§ 5.4)', () => {
  it('ellipse : courbe fermée de 401 points, contient le départ', () => {
    const etat = lancer(0.81, 8.43, 64);
    const el = elements(etat);
    const c = echantillonnerConique(el, Infinity);
    expect(c.fermee).toBe(true);
    expect(c.points.length).toBe(2 * 401);
    expect(c.points[0]).toBeCloseTo(c.points[800]!, 12);
    // Tous les points vérifient r = p/(1 + e cos ν).
    const nuDepart = anomalieVraie(el, etat.r);
    const pt = pointConique(el, nuDepart);
    expect(norm({ x: pt.x - etat.r.x, y: pt.y - etat.r.y })).toBeLessThan(1e-12);
  });

  it('hyperbole : arc limité à r ≤ R_vue, à l’intérieur des asymptotes', () => {
    const el = elements(lancer(3.99, 6.79, 159));
    const rVue = Math.max(2 * 3.99, 4 * el.rp);
    const c = echantillonnerConique(el, rVue);
    expect(c.fermee).toBe(false);
    expect(c.nuMax).toBeLessThan(el.nuInfini!);
    let rMax = 0;
    for (let k = 0; k < c.points.length; k += 2) {
      rMax = Math.max(rMax, Math.hypot(c.points[k]!, c.points[k + 1]!));
    }
    expect(rMax).toBeCloseTo(rVue, 9);
  });

  it('R_vue inférieur au périhélie : seul le périhélie (pas de NaN)', () => {
    const el = elements(lancer(3.99, 6.79, 159));
    const c = echantillonnerConique(el, el.rp / 2);
    expect(c.nuMax).toBe(0);
    expect(c.points.every(Number.isFinite)).toBe(true);
  });

  it('ellipse plus grande que la vue : arc ouvert', () => {
    const el = elements(lancer(0.81, 8.43, 64));
    const c = echantillonnerConique(el, 1.5);
    expect(c.fermee).toBe(false);
    expect(c.nuMax).toBeGreaterThan(0);
    expect(c.nuMax).toBeLessThan(Math.PI);
  });

  it('cercle plus grand que la vue : rien n’est visible (nuMax = 0)', () => {
    const el = elements(lancer(1, 2 * Math.PI, 90));
    expect(echantillonnerConique(el, 0.5).nuMax).toBe(0);
  });
});

describe('jauge de forme (§ 5.3)', () => {
  const pos = (r0: number, v0: number, th: number) => {
    const etat = lancer(r0, v0, th);
    return positionJauge(classifier(etat), elements(etat).e);
  };
  it('positions des repères', () => {
    expect(pos(1, 2 * Math.PI, 90)).toBeCloseTo(0.07, 12);
    expect(pos(0.81, 8.43, 64)).toBeCloseTo(0.14 + elements(lancer(0.81, 8.43, 64)).e * 0.46, 12);
    expect(pos(1, vLib(1), 90)).toBeCloseTo(0.67, 12);
    const eH = elements(lancer(3.99, 6.79, 159)).e;
    expect(pos(3.99, 6.79, 159)).toBeCloseTo(0.74 + ((eH - 1) / 2) * 0.26, 12);
    // Plafond : e ≥ 3 → extrémité droite.
    expect(pos(0.3, 40, 90)).toBeCloseTo(1, 12);
  });
});

describe('distance minimale pour le pas adaptatif (D-13)', () => {
  it('à l’approche : périhélie ; en éloignement : distance courante ; plancher R_COLLISION', () => {
    const approche = lancer(2, 5, 120);
    expect(distanceMinEstimee(approche)).toBeCloseTo(elements(approche).rp, 12);
    expect(distanceMinEstimee(lancer(2, 5, 60))).toBeCloseTo(2, 12);
    expect(distanceMinEstimee(lancer(2, 1, 179))).toBe(R_COLLISION);
  });
  it('μ explicite', () => {
    expect(distanceMinEstimee(lancer(2, 5, 60), MU_SOLEIL)).toBeCloseTo(2, 12);
  });
});

describe('repères géométriques (F-M1-7)', () => {
  it('foyer vide d’une ellipse : du côté de l’aphélie, à 2c du Soleil', () => {
    const el = elements(etatDepuisElements({ p: 1, e: 0.6, nu: 0.3, omega: 0.5, sens: 1 }));
    const f = foyerVide(el)!;
    expect(norm(f)).toBeCloseTo(2 * el.c!, 12);
    // Le centre de l’ellipse est le milieu des deux foyers et le milieu périhélie–aphélie.
    const peri = pointConique(el, 0);
    const aph = pointConique(el, Math.PI);
    expect((peri.x + aph.x) / 2).toBeCloseTo(f.x / 2, 12);
    expect((peri.y + aph.y) / 2).toBeCloseTo(f.y / 2, 12);
  });

  it('foyer vide d’une hyperbole : au-delà du périhélie, à 2|a|e', () => {
    const el = elements(lancer(3.99, 6.79, 159));
    const f = foyerVide(el)!;
    expect(norm(f)).toBeCloseTo(2 * Math.abs(el.a) * el.e, 12);
    expect(Math.cos(Math.atan2(f.y, f.x) - el.omega)).toBeCloseTo(1, 12);
  });

  it('pas de second foyer pour une parabole exacte (a infini)', () => {
    const el = elements(lancer(1, 1, 90));
    expect(foyerVide({ ...el, a: Infinity })).toBeNull();
  });

  it('asymptotes : la branche tend vers des droites de directions ω ± ν∞ passant par le centre', () => {
    const el = elements(lancer(3.99, 6.79, 159));
    const as = asymptotes(el)!;
    expect(norm(as.centre)).toBeCloseTo(Math.abs(el.a) * el.e, 12);
    // Un point très loin sur la branche est proche de l’asymptote correspondante.
    const loin = pointConique(el, el.nuInfini! - 1e-6);
    for (const dir of as.directions) {
      const u = { x: Math.cos(dir), y: Math.sin(dir) };
      const d = { x: loin.x - as.centre.x, y: loin.y - as.centre.y };
      const distance = Math.abs(d.x * u.y - d.y * u.x);
      if (d.x * u.x + d.y * u.y > 0) expect(distance / norm(d)).toBeLessThan(1e-5);
    }
    expect(asymptotes(elements(lancer(1, 5, 90)))).toBeNull();
  });

  it('aire balayée et durée des secteurs (F-M1-8)', () => {
    expect(aireBalayee(-2, 0.5)).toBe(0.5);
    const ell = lancer(0.81, 8.43, 64);
    expect(dureeSecteur(elements(ell), classifier(ell), 12)).toBeCloseTo(
      elements(ell).periode! / 12,
      12,
    );
    const hyp = lancer(3.99, 6.79, 159);
    expect(dureeSecteur(elements(hyp), classifier(hyp), 12)).toBeCloseTo(
      elements(hyp).rp ** 1.5 / 12,
      12,
    );
    const presque = lancer(1, vLib(1) * 0.999, 90);
    expect(classifier(presque)).toMatchObject({ forme: 'parabole' });
    expect(dureeSecteur(elements(presque), classifier(presque), 12)).toBeCloseTo(
      elements(presque).rp ** 1.5 / 12,
      12,
    );
    expect(dureeSecteur(elements(lancer(1, 3, 0)), classifier(lancer(1, 3, 0)), 12)).toBeNull();
  });
});
