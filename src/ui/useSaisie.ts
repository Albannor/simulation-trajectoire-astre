import { useState } from 'react';
import { format, parseNombre } from '../format';

/**
 * Saisie numérique tolérante (§ 4.3) liée à une valeur : validée à la sortie du champ ou par Entrée,
 * bornée à [min, max], annulée par Échap ou si invalide. Si la valeur change ailleurs (glisser,
 * préréglage), une saisie abandonnée est ignorée.
 */
export function useSaisie(
  valeur: number,
  decimales: number,
  min: number,
  max: number,
  onChange: (valeur: number) => void,
) {
  const [edition, setEdition] = useState<{ texte: string; base: number } | null>(null);
  const saisie = edition && edition.base === valeur ? edition.texte : null;
  const affiche = format(valeur, decimales);

  const valider = () => {
    if (saisie === null) return;
    const lu = parseNombre(saisie);
    setEdition(null);
    if (lu !== null) onChange(Math.min(max, Math.max(min, lu)));
  };

  return {
    affiche,
    proprietes: {
      type: 'text',
      inputMode: 'decimal' as const,
      value: saisie ?? affiche,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setEdition({ texte: e.target.value, base: valeur }),
      onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
      onBlur: valider,
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') valider();
        if (e.key === 'Escape') setEdition(null);
      },
    },
  };
}
