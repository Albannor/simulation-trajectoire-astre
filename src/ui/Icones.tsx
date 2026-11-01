/** Icônes décoratives (le texte accessible est porté par le bouton). */

const attributs = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

export const IconeLancer = () => (
  <svg {...attributs}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </svg>
);

export const IconePause = () => (
  <svg {...attributs}>
    <path d="M8 5v14M16 5v14" strokeWidth={3.5} />
  </svg>
);

export const IconePas = () => (
  <svg {...attributs}>
    <path d="M6 5l10 7-10 7z" />
    <path d="M19 5v14" />
  </svg>
);

export const IconeRecommencer = () => (
  <svg {...attributs}>
    <path d="M4 12a8 8 0 1 0 2.5-5.8" />
    <path d="M4 4v5h5" />
  </svg>
);

export const IconeMoins = () => (
  <svg {...attributs}>
    <path d="M5 12h14" />
  </svg>
);

export const IconePlus = () => (
  <svg {...attributs}>
    <path d="M5 12h14M12 5v14" />
  </svg>
);

export const IconeRecentrer = () => (
  <svg {...attributs}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v5M12 17v5M2 12h5M17 12h5" />
  </svg>
);
