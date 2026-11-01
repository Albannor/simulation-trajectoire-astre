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
    droite: 'droite',
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
    zoom: 'Zoom',
  },

  scene: {
    soleil: 'Soleil',
    astre: 'astre',
    depart: 'départ',
    foyer: 'foyer',
    perihelie: 'périhélie',
    aphelie: 'aphélie',
    /** Description textuelle du dessin (role="img"). */
    description: (forme: string, distance: string, temps: string) =>
      `Simulation : trajectoire ${forme}. L’astre est à ${distance} UA du Soleil, après ${temps} an.`,
  },

  mesures: {
    distance: 'Distance',
    vitesse: 'Vitesse',
    temps: 'Temps écoulé',
    ralenti: 'simulation ralentie',
    ralentiDetail:
      'Le calcul ne suit pas la vitesse demandée : le temps défile moins vite pour rester précis.',
    precisionCorrecte: 'précision correcte',
    precisionDegradee: 'précision réduite',
    precisionDetail: (ecart: string) =>
      `Écart d’énergie dû au calcul : ${ecart} (correct en dessous de 0,01 %).`,
  },

  fins: {
    collision: 'Collision avec le Soleil',
    sortie: 'L’astre s’éloigne pour toujours',
    contact: 'Contact entre les deux corps',
    separation: 'Les corps se séparent',
  },

  scene2: {
    centreDeMasse: 'centre de masse',
    masse: (m: string) => `masse ${m}`,
    depart: (corps: string) => `départ ${corps}`,
    description: (lies: string, distance: string, temps: string) =>
      `Simulation de deux corps : ${lies}. Distance entre A et B : ${distance} UA, après ${temps} an.`,
  },

  presets2: {
    titre: 'Choisis un duo',
    massesEgales: 'Masses égales',
    grosEtPetit: 'Gros et petit (10 : 1)',
    planeteSoleil: 'Planète – Soleil',
    visiteur: 'Un visiteur qui passe',
    orbiteCirculaire: 'Orbite circulaire',
  },

  lancement2: {
    corpsA: 'Corps A',
    corpsB: 'Corps B',
    masse: (corps: string) => `Masse de ${corps}`,
    position: 'Position au départ',
    vitesse: 'Vitesse au départ',
    x: 'horizontale x',
    y: 'verticale y',
    vx: 'vers la droite',
    vy: 'vers le haut',
    gestes: 'Avant le lancement, tu peux aussi glisser chaque corps et tirer sa flèche de vitesse.',
  },

  pointDeVue: {
    titre: 'Point de vue',
    fixe: 'Fixe',
    centreDeMasse: 'Centre de masse',
    centreA: 'Centré sur A',
    centreB: 'Centré sur B',
    annulerDerive: 'Annuler la dérive',
    annulerDeriveDetail:
      'Au lancement, la vitesse d’ensemble du duo est ramenée à zéro : il ne dérive plus en vue fixe.',
  },

  duo: {
    titre: 'Le duo',
    lies: 'Corps liés',
    nonLies: 'Corps non liés',
    liesDetail: 'l’énergie totale est négative',
    nonLiesDetail: 'ils se séparent',
    contact: 'Attention : les deux corps vont se percuter.',
    rapport: 'Rapport de masses',
    excentricite: 'Excentricité relative',
    periode: 'Période',
    demiGrandAxe: 'Demi-grand axe relatif',
  },

  afficher2: {
    orbitesPrevues: 'Orbites prévues',
    trainees: 'Traînées',
    centreDeMasse: 'Centre de masse',
    ligneAB: 'Ligne A – B',
    flechesVitesse: 'Flèches de vitesse',
    orbitesMasquees:
      'En vue fixe, le duo se déplace : son orbite n’est pas une courbe fixe. Choisis le point de vue « Centre de masse » pour la voir.',
  },

  mesures2: {
    distance: 'Distance A – B',
    vitesse: 'Vitesse relative',
  },

  presets1: {
    titre: 'Choisis un astre',
    terre: 'Terre',
    mars: 'Mars',
    halley: 'Comète de Halley',
    cometeHyperbolique: 'Comète hyperbolique',
    orbiteCirculaire: 'Orbite circulaire',
    parabole: 'Parabole',
  },

  lancement: {
    titre: 'Le lancement',
    distance: 'Distance au Soleil',
    rappelDistance: '1 UA = distance Terre – Soleil',
    vitesse: 'Vitesse de départ',
    rappelTerre: 'Repère : la Terre va à 6,28 UA/an',
    circulaire: 'circulaire',
    liberation: 'libération',
    repereCirculaire: (v: string) => `Caler la vitesse sur la vitesse circulaire, ${v} UA/an`,
    repereLiberation: (v: string) => `Caler la vitesse sur la vitesse de libération, ${v} UA/an`,
    aimant: 'Aimant',
    aimantDetail: 'Près d’un repère, la flèche s’y aligne',
    direction: 'Direction du lancer',
    rappelDirection: '0° : s’éloigne du Soleil · 90° : de côté · 180° : plonge vers lui',
    sens: 'Sens de rotation',
    antiHoraire: 'Sens inverse des aiguilles d’une montre',
    horaire: 'Sens des aiguilles d’une montre',
    saisie: (libelle: string) => `${libelle}, valeur`,
    gestes: 'Avant le lancement, tu peux aussi glisser l’astre et tirer sa flèche de vitesse.',
  },

  forme: {
    titre: 'Forme de la trajectoire',
    excentricite: 'excentricité',
    presque: 'presque',
    collision: 'Attention : l’astre ira percuter le Soleil.',
    jauge: (forme: string, e: string) => `Jauge de forme : ${forme}, excentricité ${e}`,
    droite: 'Trajectoire droite',
  },

  mesuresOrbite: {
    titre: 'Mesures de l’orbite',
    demiGrandAxe: 'Demi-grand axe',
    periode: 'Période',
    perihelie: 'Périhélie',
    aphelie: 'Aphélie',
    vitesseLoin: 'Vitesse très loin',
    deviation: 'Déviation',
  },

  afficher: {
    titre: 'Afficher',
    orbitePrevue: 'Orbite prévue',
    perihelieAphelie: 'Périhélie / aphélie',
    perihelie: 'Périhélie',
    foyers: 'Foyers',
    cercleReference: 'Cercle de référence',
    asymptotes: 'Asymptotes',
    loiDesAires: 'Loi des aires',
    effacerTraces: 'Effacer les traces',
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
