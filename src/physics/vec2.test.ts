import { describe, expect, it } from 'vitest';
import { add, cross, dot, norm, polar, scale, sub, vec2 } from './vec2';

describe('vec2', () => {
  it('opérations de base', () => {
    const a = vec2(3, 4);
    const b = vec2(1, -2);
    expect(add(a, b)).toEqual({ x: 4, y: 2 });
    expect(sub(a, b)).toEqual({ x: 2, y: 6 });
    expect(scale(a, 2)).toEqual({ x: 6, y: 8 });
    expect(dot(a, b)).toBe(-5);
    expect(norm(a)).toBe(5);
  });
  it('produit vectoriel positif dans le sens anti-horaire (§ 4.2)', () => {
    expect(cross(vec2(1, 0), vec2(0, 1))).toBe(1);
    expect(cross(vec2(0, 1), vec2(1, 0))).toBe(-1);
  });
  it('vecteur polaire', () => {
    const p = polar(Math.PI / 2, 2);
    expect(p.x).toBeCloseTo(0, 15);
    expect(p.y).toBeCloseTo(2, 15);
  });
});
