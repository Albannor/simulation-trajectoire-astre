/**
 * Constantes configurables (spécifications § 4.4 et décisions consignées dans docs/DECISIONS.md).
 * Unités : UA, an, UA/an, masse solaire. Aucune autre constante numérique ne doit apparaître
 * en dur dans le module physique.
 */

/** Distance de contact Soleil–astre et A–B (UA). Valeur pédagogique, supérieure au rayon réel. */
export const R_COLLISION = 0.05;

/** Au-delà de cette distance (UA), si l'énergie est ≥ 0, l'astre est parti pour toujours. */
export const R_SORTIE = 100;

/** Une excentricité e < TOL_CERCLE est affichée « cercle ». */
export const TOL_CERCLE = 0.01;

/** Une excentricité |e − 1| ≤ TOL_PARABOLE est affichée « parabole ». */
export const TOL_PARABOLE = 0.01;

/**
 * En deçà de |e − 1| < E_PARABOLE_EXACTE, la parabole est dite exacte (pas de mention « presque »).
 * Décision D-04 (docs/DECISIONS.md) : l'égalité stricte e = 1 n'existe pas en virgule flottante.
 */
export const E_PARABOLE_EXACTE = 1e-9;

/** Seuil du cas radial : |h| < H_RADIAL (UA²/an) → trajectoire droite, pas de conique (§ 5.3). */
export const H_RADIAL = 1e-6;

/** Facteur du pas de temps adaptatif (§ 5.7) : dt_max = ETA · √(d_min³ / (G·M_tot)). */
export const ETA = 0.002;

/** Vitesse du temps « ×1 » (an de simulation par seconde réelle) : 1 an = 10 s à l'écran. */
export const TEMPS_X1 = 0.1;

/** Multiplicateurs de vitesse du temps proposés (§ 5.7, F-SIM-2). */
export const MULTIPLICATEURS_TEMPS = [0.1, 1, 10, 100] as const;

/** Multiplicateur par défaut (§ 11, point 6). */
export const MULTIPLICATEUR_TEMPS_DEFAUT = 1;

/** Nombre maximal de sous-pas d'intégration par image. */
export const MAX_SOUS_PAS = 5000;

/** Taille du tampon de trace par corps (points). */
export const TRAINEE_MAX = 50_000;

/** Seuil de l'indicateur de précision (§ 5.7) : « précision correcte » si l'écart relatif d'énergie est inférieur. */
export const SEUIL_PRECISION = 1e-4;

/** Affichage de l'excentricité avec 3 décimales si |e − 1| < SEUIL_E_3_DECIMALES (§ 4.3). */
export const SEUIL_E_3_DECIMALES = 0.05;
