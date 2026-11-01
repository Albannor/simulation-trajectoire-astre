import { describe, expect, it } from 'vitest';
import { type PointDeVue, origine, poidsOrigine, positionReelle } from './referentiel';

describe('points de vue (§ 5.6)', () => {
  it('poids de l’origine', () => {
    expect(poidsOrigine('fixe', 2, 1)).toEqual([0, 0]);
    expect(poidsOrigine('centreDeMasse', 2, 1)).toEqual([2 / 3, 1 / 3]);
    expect(poidsOrigine('centreA', 2, 1)).toEqual([1, 0]);
    expect(poidsOrigine('centreB', 2, 1)).toEqual([0, 1]);
  });

  it('origine = centre de masse', () => {
    expect(origine(poidsOrigine('centreDeMasse', 2, 1), 0, 0, 3, 3)).toEqual({ x: 1, y: 1 });
  });

  it.each(['fixe', 'centreDeMasse', 'centreA', 'centreB'] as PointDeVue[])(
    '%s : le corps déplacé s’affiche bien sous le pointeur',
    (vue) => {
      const poids = poidsOrigine(vue, 2, 0.5);
      const b = { x: 1.2, y: -0.7 };
      const affiche = { x: -0.4, y: 2.1 };
      const a = positionReelle(poids, 'a', affiche, b);
      if (vue === 'centreA') {
        expect(a).toBeNull();
        return;
      }
      const o = origine(poids, a!.x, a!.y, b.x, b.y);
      expect(a!.x - o.x).toBeCloseTo(affiche.x, 12);
      expect(a!.y - o.y).toBeCloseTo(affiche.y, 12);
    },
  );

  it('corps B dans la vue centrée sur A', () => {
    const poids = poidsOrigine('centreA', 1, 1);
    expect(positionReelle(poids, 'b', { x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
    expect(
      positionReelle(poidsOrigine('centreB', 1, 1), 'b', { x: 1, y: 2 }, { x: 0, y: 0 }),
    ).toBeNull();
  });
});
