/**
 * Formatage et lecture des nombres au format fr-FR (spécifications § 4.3) :
 * virgule décimale, signe moins typographique « − » (U+2212), espace fine insécable (U+202F)
 * pour les milliers ; saisie tolérante (« , » ou « . », « - » ou « − »).
 */

import { SEUIL_E_3_DECIMALES } from './config';
import { radToDeg } from './physics/constants';

export const MOINS = '−';

const formateurs = new Map<number, Intl.NumberFormat>();

function formateur(decimales: number): Intl.NumberFormat {
  let f = formateurs.get(decimales);
  if (!f) {
    f = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
      useGrouping: true,
    });
    formateurs.set(decimales, f);
  }
  return f;
}

/** Formate un nombre (2 décimales par défaut) : `format(-0.8)` → « −0,80 ». */
export function format(valeur: number, decimales = 2): string {
  if (!Number.isFinite(valeur)) return valeur > 0 ? '∞' : valeur < 0 ? `${MOINS}∞` : '—';
  // Un négatif qui s'arrondit à zéro s'affiche « 0,00 » et non « −0,00 » (inclut −0).
  // (signDisplay: 'negative' ferait de même mais exige Safari ≥ 15.4 ; on reste compatible.)
  const affiche = Math.abs(valeur) < 0.5 * 10 ** -decimales ? 0 : valeur;
  return (
    formateur(decimales)
      .format(affiche)
      // Selon le moteur, le signe produit est « - » (U+002D) ou « − » (U+2212) : on normalise.
      .replace(/-/g, MOINS)
      // Certains moteurs utilisent l'espace insécable U+00A0 : on normalise vers l'espace fine U+202F.
      .replace(/\u00a0/g, '\u202f')
  );
}

/** Excentricité : 2 décimales, 3 si |e − 1| < 0,05 (§ 4.3). */
export function formatExcentricite(e: number): string {
  return format(e, Math.abs(e - 1) < SEUIL_E_3_DECIMALES ? 3 : 2);
}

/** Angle donné en radians, affiché en degrés entiers (§ 4.3). */
export function formatAngle(radians: number): string {
  return format(radToDeg(radians), 0);
}

const NOMBRE = /^[+-]?(\d+(\.\d*)?|\.\d+)$/;

/**
 * Lit une saisie utilisateur tolérante. Renvoie `null` si la saisie n'est pas un nombre.
 * Accepte « , » ou « . » comme séparateur décimal, « - » ou « − » comme signe, et ignore
 * les espaces (y compris insécables et fines) servant de séparateurs de milliers.
 */
export function parseNombre(texte: string): number | null {
  const normalise = texte
    .trim()
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(/\u2212/g, '-')
    .replace(',', '.');
  if (!NOMBRE.test(normalise)) return null;
  const valeur = Number(normalise);
  return Number.isFinite(valeur) ? valeur : null;
}
