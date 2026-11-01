import { useEffect, useState } from 'react';
import { MESURES_HZ } from '../config';

/** Valeur recalculée à MESURES_HZ (mesures en direct, § 8.3). */
export function useIntervalle<T>(lire: () => T): T {
  const [valeur, setValeur] = useState(lire);
  useEffect(() => {
    const id = window.setInterval(() => setValeur(lire()), 1000 / MESURES_HZ);
    return () => window.clearInterval(id);
  }, [lire]);
  return valeur;
}
