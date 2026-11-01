import { describe, expect, it } from 'vitest';
import { type Memoire, type Stockage, CLE_STOCKAGE, ecrireMemoire, lireMemoire } from './storage';

function stockageFactice(initial: Record<string, string> = {}): Stockage {
  const donnees = new Map(Object.entries(initial));
  return {
    getItem: (cle) => donnees.get(cle) ?? null,
    setItem: (cle, valeur) => void donnees.set(cle, valeur),
  };
}

const MEMOIRE: Memoire = {
  mode: 'mode2',
  mode1: { r0: 0.81, v0: 8.43, theta: 1.117, sens: -1, phi0: 1.27 },
  mode2: {
    a: { masse: 2, r: { x: 0, y: -0.83 }, v: { x: 2.31, y: -1.15 } },
    b: { masse: 1, r: { x: 0, y: 1.65 }, v: { x: -4.61, y: 2.31 } },
  },
  explications: true,
  multiplicateur: 10,
};

describe('mémorisation locale (F-APP-3)', () => {
  it('aller-retour', () => {
    const s = stockageFactice();
    expect(ecrireMemoire(s, MEMOIRE)).toBe(true);
    expect(lireMemoire(s)).toEqual(MEMOIRE);
  });

  it('rien d’enregistré ou JSON corrompu : mémoire vide', () => {
    expect(lireMemoire(stockageFactice())).toEqual({});
    expect(lireMemoire(stockageFactice({ [CLE_STOCKAGE]: '{pas du json' }))).toEqual({});
    expect(lireMemoire(stockageFactice({ [CLE_STOCKAGE]: '42' }))).toEqual({});
  });

  it('champs invalides ignorés un par un, les autres conservés', () => {
    const abime = {
      ...MEMOIRE,
      mode: 'mode3',
      mode1: { ...MEMOIRE.mode1, r0: 50 },
      mode2: { ...MEMOIRE.mode2, b: { ...MEMOIRE.mode2.b, masse: 0 } },
      multiplicateur: 7,
    };
    const lu = lireMemoire(stockageFactice({ [CLE_STOCKAGE]: JSON.stringify(abime) }));
    expect(lu).toEqual({ explications: true });
  });

  it('valeurs non finies refusées', () => {
    const texte = JSON.stringify({ ...MEMOIRE, mode1: { ...MEMOIRE.mode1, v0: null } });
    expect(lireMemoire(stockageFactice({ [CLE_STOCKAGE]: texte })).mode1).toBeUndefined();
  });

  it('stockage absent, interdit ou plein : l’application continue', () => {
    const hostile: Stockage = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(lireMemoire(null)).toEqual({});
    expect(lireMemoire(hostile)).toEqual({});
    expect(ecrireMemoire(null, MEMOIRE)).toBe(false);
    expect(ecrireMemoire(hostile, MEMOIRE)).toBe(false);
  });
});
