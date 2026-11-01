import { describe, expect, it } from 'vitest';
import { G, MU_SOLEIL, degToRad, radToDeg } from './constants';

describe('constantes physiques', () => {
  it('G = 4π² ≈ 39,4784176 (§ 4.1)', () => {
    expect(G).toBeCloseTo(39.4784176, 7);
    expect(MU_SOLEIL).toBe(G);
  });

  it('3ᵉ loi de Kepler normalisée : a = 1 UA, M = 1 → T = 1 an', () => {
    const a = 1;
    const periode = 2 * Math.PI * Math.sqrt(a ** 3 / MU_SOLEIL);
    expect(periode).toBeCloseTo(1, 12);
  });

  it('vitesse circulaire de la Terre = 2π UA/an', () => {
    expect(Math.sqrt(MU_SOLEIL / 1)).toBeCloseTo(2 * Math.PI, 12);
  });
});

describe('conversions d’angles', () => {
  it('degrés ↔ radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 15);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 15);
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 12);
    expect(radToDeg(degToRad(159))).toBeCloseTo(159, 12);
  });
});
