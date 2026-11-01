import { describe, expect, it } from 'vitest';
import { Trace } from './trace';

const points = (t: Trace) => {
  const r: [number, number][] = [];
  t.parcourir((x, y) => r.push([x, y]));
  return r;
};

describe('trace (tampon circulaire)', () => {
  it('conserve l’ordre et écrase les plus anciens points', () => {
    const t = new Trace(3);
    for (let k = 1; k <= 5; k++) t.ajouter(k, -k);
    expect(t.longueur).toBe(3);
    expect(points(t)).toEqual([
      [3, -3],
      [4, -4],
      [5, -5],
    ]);
  });

  it('échantillonnage par distance minimale', () => {
    const t = new Trace(10);
    expect(t.ajouterSiEloigne(0, 0, 1)).toBe(true);
    expect(t.ajouterSiEloigne(0.5, 0, 1)).toBe(false);
    expect(t.ajouterSiEloigne(1, 0, 1)).toBe(true);
    expect(t.longueur).toBe(2);
  });

  it('vider', () => {
    const t = new Trace(4);
    t.ajouter(1, 1);
    t.vider();
    expect(t.longueur).toBe(0);
    expect(t.ajouterSiEloigne(1, 1, 10)).toBe(true);
  });
});
