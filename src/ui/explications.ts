import { createContext, useContext } from 'react';

/** Interrupteur « Explications » (F-APP-2), partagé par toutes les bulles. */
export const ContexteExplications = createContext(false);

export function useExplications(): boolean {
  return useContext(ContexteExplications);
}
