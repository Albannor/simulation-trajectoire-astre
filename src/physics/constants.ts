/**
 * Constantes physiques et conversions d'angles.
 * Système d'unités unique : UA, an, UA/an, masse solaire (spécifications § 4.1).
 */

/** Constante gravitationnelle en UA³·an⁻²·(masse solaire)⁻¹ : 3ᵉ loi de Kepler normalisée. */
export const G = 4 * Math.PI ** 2;

/** Paramètre gravitationnel du Soleil μ☉ = G·M☉ avec M☉ = 1 (≈ 39,4784176). */
export const MU_SOLEIL = G;

/** Conversion degrés → radians (saisie uniquement). */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Conversion radians → degrés (affichage uniquement). */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
