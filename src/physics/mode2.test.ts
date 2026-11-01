import { describe, expect, it } from 'vitest';
import { R_COLLISION, R_SORTIE, REGLAGES_DEFAUT_MODE2, TEMPS_X1 } from '../config';
import { G } from './constants';
import { classifier, elements } from './kepler';
import { ecartEnergie } from './mode1';
import {
  type ReglagesMode2,
  annulerDerive,
  avancerMode2,
  corpsDuSysteme,
  creerSystemeMode2,
  finMode2,
  grandeursMode2,
  rapportMasses,
  reglagesDepuisRelatif,
} from './mode2';
import { energieTotale } from './nbody';
import { presetMode2 } from './presets';
import { norm } from './vec2';

/*
 * Simulations découpées comme l'animation (images de TEMPS_X1·k/60 an), mesures au sous-pas.
 * Tolérances calibrées le 2026-11-01 (valeur mesurée en commentaire).
 */

const T11 = reglagesDepuisRelatif(REGLAGES_DEFAUT_MODE2.masseA, REGLAGES_DEFAUT_MODE2.masseB, {
  r: REGLAGES_DEFAUT_MODE2.rRel,
  v: REGLAGES_DEFAUT_MODE2.vRel,
});

function simuler(
  reg: ReglagesMode2,
  duree: number,
  multiplicateur: number,
  observer: (c: ReglagesMode2, t: number) => void,
) {
  let s = creerSystemeMode2(reg);
  const g0 = grandeursMode2(reg.a, reg.b);
  const energie = elements(g0.relatif, g0.mu).energie;
  const di = (TEMPS_X1 * multiplicateur) / 60;
  for (let k = 0; k < Math.round(duree / di); k++) {
    const res = avancerMode2(s, di, energie, (sys) => observer(corpsDuSysteme(sys), sys.t));
    s = res.systeme;
    if (res.evenement) return res.evenement;
  }
  return null;
}

describe('T-10 barycentre', () => {
  // Quantité de mouvement non nulle : le système dérive.
  const reg: ReglagesMode2 = {
    a: { masse: 2, r: { x: 1, y: -0.5 }, v: { x: 1.3, y: -2 } },
    b: { masse: 0.7, r: { x: -1, y: 1.5 }, v: { x: -3, y: 4.1 } },
  };
  const g0 = grandeursMode2(reg.a, reg.b);

  it.each([1, 100])('×%d : V_cm constante (< 1e-9), G_cm(t) = G_cm(0) + V_cm·t', (k) => {
    let dV = 0;
    let dG = 0;
    simuler(reg, 5, k, (c, t) => {
      const g = grandeursMode2(c.a, c.b);
      dV = Math.max(dV, norm({ x: g.vCm.x - g0.vCm.x, y: g.vCm.y - g0.vCm.y }));
      const attendu = { x: g0.gCm.x + g0.vCm.x * t, y: g0.gCm.y + g0.vCm.y * t };
      dG = Math.max(dG, norm({ x: g.gCm.x - attendu.x, y: g.gCm.y - attendu.y }));
    });
    // Mesuré : 2,2e-14 (×1) ; 4,1e-15 (×100) — forces opposées : arrondis seulement.
    expect(dV).toBeLessThan(1e-9);
    // Mesuré : 4,5e-11 (×1) ; 9,2e-13 (×100). L'écart vient surtout de l'arrondi accumulé sur
    // t (somme de ~30 000 pas à ×1), multiplié par |V_cm| ≈ 0,46 UA/an, et des arrondis de la somme des positions. Tolérance 1e-9.
    expect(dG).toBeLessThan(1e-9);
  });
});

describe('T-11 conique relative (masses 2 et 1)', () => {
  it('a ≈ 3,3 ; e ≈ 0,50 ; T ≈ 3,46 ; corps liés', () => {
    const g = grandeursMode2(T11.a, T11.b);
    expect(g.mu).toBeCloseTo(3 * G, 12);
    const el = elements(g.relatif, g.mu);
    // Valeurs calculées : a = 3,322 ; e = 0,5014 ; T = 3,495 (D-07 : la maquette affiche 3,30 et 3,46).
    expect(Math.abs(el.a - 3.3)).toBeLessThanOrEqual(0.05);
    expect(Math.abs(el.e - 0.5)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(el.periode! - 3.46)).toBeLessThanOrEqual(0.05);
    expect(el.periode).toBeCloseTo(Math.sqrt(el.a ** 3 / g.masseTotale), 12);
    expect(el.energie).toBeLessThan(0);
  });
  it('position de départ de la maquette 3 : A en (0 ; −0,83), vitesse (2,31 ; −1,15)', () => {
    expect(T11.a.r.y).toBeCloseTo(-0.83, 2);
    expect(T11.a.v.x).toBeCloseTo(2.31, 2);
    expect(T11.a.v.y).toBeCloseTo(-1.15, 2);
  });
  it.each([1, 100])('×%d : énergie totale conservée sur 5 périodes', (k) => {
    const e0 = energieTotale(creerSystemeMode2(T11));
    let dE = 0;
    simuler(T11, 5 * 3.495, k, (c) => {
      const e = energieTotale(creerSystemeMode2(c));
      dE = Math.max(dE, Math.abs((e - e0) / e0));
    });
    // Mesuré : 2,1e-6 (×1) ; 1,5e-6 (×100). Tolérance 2e-5.
    expect(dE).toBeLessThan(2e-5);
  });
});

describe('T-12 préréglage « Masses égales »', () => {
  const reg = presetMode2('massesEgales', T11);
  const g = grandeursMode2(reg.a, reg.b);
  it('orbite relative circulaire, v_rel = 2π, chaque corps à π en sens opposés', () => {
    expect(elements(g.relatif, g.mu).e).toBeLessThan(1e-6);
    expect(norm(g.relatif.v)).toBeCloseTo(2 * Math.PI, 12);
    expect(norm(reg.a.v)).toBeCloseTo(Math.PI, 12);
    expect(norm(reg.b.v)).toBeCloseTo(Math.PI, 12);
    expect(reg.a.v.x + reg.b.v.x).toBeCloseTo(0, 12);
    expect(reg.a.v.y + reg.b.v.y).toBeCloseTo(0, 12);
    expect(norm(g.relatif.r)).toBeCloseTo(2, 12);
    // B au-dessus de A (maquette 3).
    expect(reg.b.r.y).toBeGreaterThan(0);
    expect(Math.abs(reg.b.r.x)).toBeLessThan(1e-12);
  });
});

describe('T-13 rapports', () => {
  it.each(['grosEtPetit', 'planeteSoleil'] as const)(
    '%s : |r⃗A|/|r⃗B| = mB/mA à chaque instant',
    (nom) => {
      const reg = presetMode2(nom, T11);
      const attendu = reg.b.masse / reg.a.masse;
      let ecart = 0;
      simuler(reg, 2, 10, (c) => {
        ecart = Math.max(ecart, Math.abs(norm(c.a.r) / norm(c.b.r) / attendu - 1));
      });
      // Mesuré : 4,6e-14 (grosEtPetit) ; 3,5e-14 (planeteSoleil). Tolérance 1e-12.
      expect(ecart).toBeLessThan(1e-12);
    },
  );
});

describe('préréglages du mode 2 (§ 6.5)', () => {
  const rel = (reg: ReglagesMode2) => {
    const g = grandeursMode2(reg.a, reg.b);
    return { g, el: elements(g.relatif, g.mu), cl: classifier(g.relatif, g.mu) };
  };
  it('barycentre à l’origine et vitesse totale nulle', () => {
    for (const nom of ['massesEgales', 'grosEtPetit', 'planeteSoleil', 'visiteur'] as const) {
      const { g } = rel(presetMode2(nom, T11));
      expect(norm(g.gCm)).toBeLessThan(1e-12);
      expect(norm(g.vCm)).toBeLessThan(1e-12);
    }
  });
  it('Gros et petit : 1/0,1, ellipse a = 2, e = 0,5, départ à l’apoastre', () => {
    const reg = presetMode2('grosEtPetit', T11);
    const { g, el } = rel(reg);
    expect([reg.a.masse, reg.b.masse]).toEqual([1, 0.1]);
    expect(el.a).toBeCloseTo(2, 10);
    expect(el.e).toBeCloseTo(0.5, 10);
    expect(norm(g.relatif.r)).toBeCloseTo(3, 10);
  });
  it('Planète – Soleil : 1/0,01, cercle a = 1', () => {
    const reg = presetMode2('planeteSoleil', T11);
    const { el } = rel(reg);
    expect([reg.a.masse, reg.b.masse]).toEqual([1, 0.01]);
    expect(el.e).toBeLessThan(1e-9);
    expect(el.a).toBeCloseTo(1, 10);
  });
  it('Un visiteur qui passe : hyperbole e = 1,5, rp = 1, départ à 6 UA en approche (D-05)', () => {
    const { g, el, cl } = rel(presetMode2('visiteur', T11));
    expect(cl).toMatchObject({ forme: 'hyperbole', collision: false });
    expect(el.e).toBeCloseTo(1.5, 10);
    expect(el.rp).toBeCloseTo(1, 10);
    expect(norm(g.relatif.r)).toBeCloseTo(6, 10);
    expect(g.relatif.r.x * g.relatif.v.x + g.relatif.r.y * g.relatif.v.y).toBeLessThan(0);
  });
  it('Orbite circulaire : masses et distance courantes, même sens', () => {
    const reg = presetMode2('orbiteCirculaire', T11);
    const { g, el } = rel(reg);
    expect([reg.a.masse, reg.b.masse]).toEqual([2, 1]);
    expect(el.e).toBeLessThan(1e-9);
    expect(norm(g.relatif.r)).toBeCloseTo(2.48, 10);
    expect(el.sens).toBe(elements(grandeursMode2(T11.a, T11.b).relatif, g.mu).sens);
  });
});

describe('fins de simulation et outils', () => {
  it('contact et séparation (§ 5.7)', () => {
    expect(finMode2({ r: { x: R_COLLISION / 2, y: 0 }, v: { x: 0, y: 0 } }, -1)).toBe('contact');
    expect(finMode2({ r: { x: R_SORTIE + 1, y: 0 }, v: { x: 0, y: 0 } }, 1)).toBe('separation');
    expect(finMode2({ r: { x: R_SORTIE + 1, y: 0 }, v: { x: 0, y: 0 } }, -1)).toBeNull();
  });
  it('chute radiale des deux corps : contact détecté', () => {
    const reg: ReglagesMode2 = {
      a: { masse: 1, r: { x: -1, y: 0 }, v: { x: 0, y: 0 } },
      b: { masse: 1, r: { x: 1, y: 0 }, v: { x: 0, y: 0 } },
    };
    expect(simuler(reg, 2, 10, () => undefined)).toBe('contact');
  });
  it('« Un visiteur qui passe » se sépare (×100)', () => {
    expect(simuler(presetMode2('visiteur', T11), 200, 100, () => undefined)).toBe('separation');
  });
  it('annuler la dérive : V_cm nulle, vitesse relative inchangée', () => {
    const reg: ReglagesMode2 = {
      a: { masse: 2, r: { x: 0, y: 0 }, v: { x: 1, y: 2 } },
      b: { masse: 1, r: { x: 1, y: 0 }, v: { x: 4, y: -1 } },
    };
    const corrige = annulerDerive(reg);
    const avant = grandeursMode2(reg.a, reg.b);
    const apres = grandeursMode2(corrige.a, corrige.b);
    expect(norm(apres.vCm)).toBeLessThan(1e-12);
    expect(apres.relatif.v.x).toBeCloseTo(avant.relatif.v.x, 12);
    expect(apres.relatif.v.y).toBeCloseTo(avant.relatif.v.y, 12);
  });
  it('rapport de masses', () => {
    expect(rapportMasses(2, 1)).toEqual({ plusLourd: 'A', facteur: 2 });
    expect(rapportMasses(0.1, 1)).toEqual({ plusLourd: 'B', facteur: 10 });
    expect(rapportMasses(1, 1)).toEqual({ plusLourd: null, facteur: 1 });
  });
  it('précision : écart d’énergie relative normalisé (D-03)', () => {
    const g = grandeursMode2(T11.a, T11.b);
    expect(ecartEnergie(g.relatif, g.relatif, g.mu)).toBe(0);
  });
});
