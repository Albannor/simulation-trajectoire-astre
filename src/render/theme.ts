/**
 * Couleurs du dessin (canvas), identiques aux jetons CSS de src/styles/theme.css (§ 7.2).
 * Le canvas ne lit pas les variables CSS : toute modification doit être faite aux deux endroits.
 */
import type { FormeTrace } from '../sim/simulationMode1';

export const theme = {
  fondSimulation: '#050813',
  texte: '#EAF0FF',
  texteSecondaire: '#AAB8DA',
  accent: '#FFC857',
  etoile: '#AAB8DA',
  repere: '#AAB8DA',
  formes: {
    cercle: '#5FD9B4',
    ellipse: '#6FA8FF',
    parabole: '#FFC857',
    hyperbole: '#FF8A5B',
    droite: '#AAB8DA',
  } satisfies Record<FormeTrace, string>,
  corpsA: '#5CD0F0',
  corpsB: '#FF8A5B',
  polices: {
    etiquette: '600 15px Figtree, system-ui, sans-serif',
    valeur: '500 14px "IBM Plex Mono", ui-monospace, monospace',
  },
} as const;
