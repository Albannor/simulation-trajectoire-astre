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

/**
 * Sous ce seuil, le vecteur excentricité est trop petit pour donner une direction de périhélie
 * fiable : on prend la direction du point de départ (décision D-14).
 */
export const E_DIRECTION_INDEFINIE = 1e-10;

/** Nombre de points d'échantillonnage de la trajectoire prévue (§ 5.4). */
export const N_POINTS_CONIQUE = 400;

/** Largeurs des 4 segments de la jauge de forme, en fraction (§ 5.3) : cercle, ellipse, parabole, hyperbole. */
export const JAUGE_SEGMENTS = {
  cercle: 0.14,
  ellipse: 0.46,
  parabole: 0.14,
  hyperbole: 0.26,
} as const;

// ——— Simulation et affichage (J2) ———

/** Plafond du temps réel pris en compte entre deux images (s) — décision D-18. */
export const DT_REEL_MAX = 0.1;

/** Durée réelle d'un « pas » (F-SIM-1) : ≈ 1/60 s à la vitesse courante. */
export const DUREE_PAS_REEL = 1 / 60;

/** Nombre d'anciennes traces conservées en atténué (F-APP-5). */
export const NB_ANCIENNES_TRACES = 3;

/** Distance écran minimale entre deux points de trace (px). */
export const TRACE_SEUIL_PX = 1.5;

/** Fréquence de rafraîchissement des mesures affichées (Hz, § 8.3). */
export const MESURES_HZ = 10;

/** Rayons de dessin, sans échelle (F-SIM-5), en px CSS. */
export const RAYON_SOLEIL_PX = 22;
export const RAYON_ASTRE_PX = 10;

/** Flèche de vitesse (F-M1-2) : px par UA/an, bornée. */
export const FLECHE_PX_PAR_VITESSE = 12;
export const FLECHE_MIN_PX = 10;
export const FLECHE_MAX_PX = 200;

/** Marge du cadrage automatique autour de la scène (px CSS). */
export const MARGE_CADRAGE_PX = 48;

/** Bornes du zoom (px par UA) et facteur des boutons ± et de la molette. */
export const ECHELLE_MIN = 0.5;
export const ECHELLE_MAX = 20_000;
export const FACTEUR_ZOOM_BOUTON = 1.25;
export const FACTEUR_ZOOM_MOLETTE = 1.0015;

/**
 * Réglages du mode 1 au premier démarrage (décision D-20) : ellipse de la maquette 1
 * (e ≈ 0,60), orientée périhélie à droite. Angles en degrés (saisie), convertis à l'usage.
 */
export const REGLAGES_DEFAUT_MODE1 = { r0: 0.81, v0: 8.43, thetaDeg: 64, sens: 1 } as const;

// ——— Panneau du mode 1 (J3) ———

/** Bornes des réglages du mode 1 (F-M1-1). */
export const R0_MIN = 0.3;
export const R0_MAX = 5;
export const V0_MIN = 0;
export const V0_MAX = 12;
export const THETA_MIN_DEG = 0;
export const THETA_MAX_DEG = 180;

/** Pas des curseurs (unités d'affichage). */
export const PAS_R0 = 0.01;
export const PAS_V0 = 0.01;
export const PAS_THETA_DEG = 1;

/** Aimant de la flèche (F-M1-3) : écart relatif à un repère de vitesse. */
export const AIMANT_TOL = 0.03;
/** Aimant de la flèche sur la direction perpendiculaire θ = 90° (décision D-22), en degrés. */
export const AIMANT_TOL_ANGLE_DEG = 3;

/** Loi des aires (F-M1-8) : nombre de secteurs par période et secteurs conservés. */
export const SECTEURS_PAR_PERIODE = 12;
export const SECTEURS_CONSERVES = 6;

/** Rayon de la zone de prise de l'astre et de la pointe de flèche (px, cible ≥ 44 px). */
export const RAYON_PRISE_PX = 24;

// ——— Mode 2 (J4) ———

/** Bornes de la masse de chaque corps (× Soleil, F-M2-1), curseur logarithmique. */
export const MASSE_MIN = 0.01;
export const MASSE_MAX = 10;

/** Bornes des saisies de position (UA) et de vitesse (UA/an) du mode 2 (décision D-25). */
export const POSITION_MAX_MODE2 = 20;
export const VITESSE_MAX_MODE2 = 50;

/** Rayon de dessin d'un corps du mode 2 (F-SIM-5) : clamp(13·m^(1/3), 5, 26) px. */
export const RAYON_CORPS_COEF_PX = 13;
export const RAYON_CORPS_MIN_PX = 5;
export const RAYON_CORPS_MAX_PX = 26;

/** En deçà, la vitesse du centre de masse est considérée nulle (orbites prévues en vue fixe, § 5.6). */
export const V_CM_NULLE = 1e-9;

/**
 * Réglages du mode 2 au premier démarrage (décision D-25) : configuration de la maquette 3 et de
 * T-11 (masses 2 et 1, r⃗_rel = (0 ; 2,48), v⃗_rel = (−6,92 ; 3,46)), barycentre à l'origine.
 */
export const REGLAGES_DEFAUT_MODE2 = {
  masseA: 2,
  masseB: 1,
  rRel: { x: 0, y: 2.48 },
  vRel: { x: -6.92, y: 3.46 },
} as const;
