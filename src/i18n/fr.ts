/**
 * Tous les textes de l'interface (français uniquement en V1, spécifications § 6.6).
 * Les textes paramétrés sont des fonctions recevant des valeurs **déjà formatées** (voir src/format.ts).
 */

export const fr = {
  app: {
    titre: 'Trajectoires',
    titreDocument: 'Trajectoires — simulation de trajectoires d’astres',
    chargement: 'Chargement…',
  },

  entete: {
    choixMode: 'Choix du mode',
    mode1: 'Un astre autour du Soleil',
    mode1Court: 'Un astre',
    mode2: 'Deux corps',
    explications: 'Explications',
    aide: 'Aide',
  },

  formes: {
    cercle: 'cercle',
    ellipse: 'ellipse',
    parabole: 'parabole',
    presqueParabole: 'presque une parabole',
    hyperbole: 'hyperbole',
    // Cas radial (décision D-01, docs/DECISIONS.md).
    droiteTombe: 'L’astre tombe droit sur le Soleil',
    droiteRetombe: 'L’astre monte, s’arrête puis retombe droit sur le Soleil',
    droitePart: 'L’astre part en ligne droite',
    collisionAnnoncee: 'ira percuter le Soleil',
  },

  commandes: {
    lancer: 'Lancer',
    pause: 'Pause',
    recommencer: 'Recommencer',
    recentrer: 'Recentrer',
    pasAPas: 'Avancer d’un pas',
    zoomPlus: 'Zoomer',
    zoomMoins: 'Dézoomer',
    vitesseTemps: 'Vitesse du temps',
  },

  unites: {
    distance: 'UA',
    temps: 'an',
    vitesse: 'UA/an',
    masse: '× Soleil',
    degre: '°',
  },

  /** Bulles d'explication (§ 6.7). */
  bulles: {
    forme:
      'L’excentricité mesure l’écart à un cercle : 0 pour un cercle, entre 0 et 1 pour une ellipse, 1 pour une parabole, plus de 1 pour une hyperbole.',
    liberation: (vLib: string, v0: string, verdict: 'assez' | 'pasAssez' | 'toutJuste') =>
      `À cette distance, il faut aller à ${vLib} UA/an pour échapper au Soleil. Ici, ${v0} : ${
        {
          assez: 'c’est largement assez.',
          pasAssez: 'ce n’est pas assez.',
          // Décision D-06 : troisième cas lorsque la trajectoire est une parabole.
          toutJuste: 'c’est tout juste la vitesse de libération.',
        }[verdict]
      }`,
    ellipse:
      'L’astre est trop lent pour s’échapper : il reste prisonnier du Soleil et revient toujours.',
    hyperbole:
      'Cet astre va plus vite que la vitesse de libération : il est attiré par le Soleil, mais ne reviendra jamais.',
    asymptotes: (deviation: string) =>
      `Les pointillés gris sont les asymptotes : très loin du Soleil, l’astre les suit presque en ligne droite. Son trajet est dévié de ${deviation}°.`,
    loiDesAires:
      'En des durées égales, l’astre balaie des surfaces égales : il va donc plus vite près du Soleil.',
    perihelieAphelie:
      'Le périhélie est le point le plus proche du Soleil, l’aphélie le plus éloigné.',
    centreDeMasse:
      'C’est le point d’équilibre du duo. Les deux corps tournent autour de lui, le plus léger fait la plus grande orbite.',
    corpsLies:
      'Si l’énergie totale est négative, les deux corps restent ensemble ; sinon ils se séparent.',
    pointDeVue: 'Change de point de vue : dans celui du centre de masse, le duo tourne sur place.',
  },
} as const;

export type Textes = typeof fr;
