import { describe, expect, it } from 'vitest';
import {
  type Camera,
  boiteDe,
  cadrer,
  deplacer,
  pincer,
  rayonVisible,
  versEcran,
  versMonde,
  zoomerAutour,
} from './camera';

const cam: Camera = { cx: 1, cy: 2, echelle: 100, largeur: 800, hauteur: 600 };

describe('caméra', () => {
  it('y vers le haut dans le monde, vers le bas à l’écran', () => {
    expect(versEcran(cam, 1, 2)).toEqual({ x: 400, y: 300 });
    expect(versEcran(cam, 2, 3)).toEqual({ x: 500, y: 200 });
  });

  it('aller-retour monde ↔ écran', () => {
    const p = versMonde(cam, ...(Object.values(versEcran(cam, -0.3, 4.2)) as [number, number]));
    expect(p.x).toBeCloseTo(-0.3, 12);
    expect(p.y).toBeCloseTo(4.2, 12);
  });

  it('le zoom garde fixe le point sous le curseur', () => {
    const z = zoomerAutour(cam, 2, 650, 120);
    expect(z.echelle).toBe(200);
    const avant = versMonde(cam, 650, 120);
    const apres = versMonde(z, 650, 120);
    expect(apres.x).toBeCloseTo(avant.x, 12);
    expect(apres.y).toBeCloseTo(avant.y, 12);
  });

  it('le zoom est borné', () => {
    expect(zoomerAutour(cam, 1e9, 0, 0).echelle).toBe(20_000);
    expect(zoomerAutour(cam, 1e-9, 0, 0).echelle).toBe(0.5);
  });

  it('glisser le fond déplace la scène avec le doigt', () => {
    const d = deplacer(cam, 50, -30);
    expect(versEcran(d, 1, 2)).toEqual({ x: 450, y: 270 });
  });

  it('cadrage : la boîte tient dans l’écran avec la marge', () => {
    const c = cadrer({ xmin: -2, xmax: 2, ymin: -1, ymax: 1 }, 800, 600, 50);
    expect(c.echelle).toBe(175); // min(700/4, 500/2)
    expect(versEcran(c, -2, 0).x).toBeCloseTo(50, 12);
    expect(versEcran(c, 2, 0).x).toBeCloseTo(750, 12);
  });

  it('boîte de points entrelacés et isolés, sans valeurs non finies', () => {
    expect(boiteDe([1, 2, -3, 4, Number.NaN, 0], { x: 0, y: -1 })).toEqual({
      xmin: -3,
      xmax: 1,
      ymin: -1,
      ymax: 4,
    });
  });

  it('pincement : le point sous le milieu des doigts suit leur milieu', () => {
    const a1 = { x: 300, y: 300 };
    const a2 = { x: 500, y: 300 };
    const b1 = { x: 250, y: 350 };
    const b2 = { x: 650, y: 350 };
    const sous = versMonde(cam, 400, 300);
    const p = pincer(cam, a1, a2, b1, b2);
    expect(p.echelle).toBeCloseTo(200, 12);
    const apres = versEcran(p, sous.x, sous.y);
    expect(apres.x).toBeCloseTo(450, 9);
    expect(apres.y).toBeCloseTo(350, 9);
  });

  it('pincement dégénéré (doigts confondus) : simple déplacement', () => {
    const p = pincer(cam, { x: 1, y: 1 }, { x: 1, y: 1 }, { x: 11, y: 1 }, { x: 11, y: 1 });
    expect(p.echelle).toBe(cam.echelle);
  });

  it('rayon visible depuis un point', () => {
    const c: Camera = { cx: 0, cy: 0, echelle: 100, largeur: 600, hauteur: 800 };
    expect(rayonVisible(c, { x: 0, y: 0 })).toBeCloseTo(5, 12);
  });
});
