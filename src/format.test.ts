import { describe, expect, it } from 'vitest';
import { format, formatAngle, formatExcentricite, parseNombre } from './format';

// T-15 — Formatage et lecture des nombres fr-FR.
describe('T-15 format', () => {
  it('format(−0,8) = « −0,80 » avec le signe U+2212', () => {
    expect(format(-0.8)).toBe('−0,80');
  });

  it('virgule décimale et 2 décimales par défaut', () => {
    expect(format(6.283185)).toBe('6,28');
    expect(format(1.5)).toBe('1,50');
  });

  it('pas de « −0,00 » pour un négatif arrondi à zéro', () => {
    expect(format(-0.001)).toBe('0,00');
    expect(format(-0)).toBe('0,00');
  });

  it('espace fine insécable (U+202F) pour les milliers', () => {
    expect(format(12345.678)).toBe('12 345,68');
    expect(format(-50000, 0)).toBe('−50 000');
  });

  it('valeurs non finies', () => {
    expect(format(Infinity)).toBe('∞');
    expect(format(Number.NaN)).toBe('—');
  });

  it('excentricité : 2 décimales, 3 si |e − 1| < 0,05', () => {
    expect(formatExcentricite(0.6014)).toBe('0,60');
    expect(formatExcentricite(1.6098)).toBe('1,61');
    expect(formatExcentricite(0.967)).toBe('0,967');
    expect(formatExcentricite(1.004)).toBe('1,004');
    expect(formatExcentricite(0.95)).toBe('0,95');
  });

  it('angles : radians en entrée, degrés entiers en sortie', () => {
    expect(formatAngle(Math.PI / 2)).toBe('90');
    expect(formatAngle((159.2 * Math.PI) / 180)).toBe('159');
  });
});

describe('T-15 lecture', () => {
  it.each([
    ['1,5', 1.5],
    ['1.5', 1.5],
    ['-2,31', -2.31], // tiret ASCII (décision D-08)
    ['−2,31', -2.31], // signe moins U+2212
    ['  0,00 ', 0],
    ['12 345,6', 12345.6],
    ['12 345,6', 12345.6],
    ['+3', 3],
    [',5', 0.5],
    ['7,', 7],
  ])('« %s » → %d', (texte, attendu) => {
    expect(parseNombre(texte)).toBe(attendu);
  });

  it.each(['', 'abc', '1,2,3', '1.2.3', '--1', '1e3', '−', ','])('« %s » → null', (texte) => {
    expect(parseNombre(texte)).toBeNull();
  });
});
