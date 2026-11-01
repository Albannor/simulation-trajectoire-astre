import { useSyncExternalStore } from 'react';

interface Observable {
  abonner: (ecouteur: () => void) => () => void;
  version: () => number;
}

/** Re-rend le composant à chaque changement discret de l'objet observé. */
export function useVersion(objet: Observable): number {
  return useSyncExternalStore(objet.abonner, objet.version);
}
