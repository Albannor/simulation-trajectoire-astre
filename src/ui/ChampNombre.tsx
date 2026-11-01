import { useId } from 'react';
import { useSaisie } from './useSaisie';

interface Props {
  libelle: string;
  valeur: number;
  min: number;
  max: number;
  decimales: number;
  onChange: (valeur: number) => void;
}

/** Champ numérique libellé, saisie fr-FR tolérante (F-M2-1). */
export function ChampNombre({ libelle, valeur, min, max, decimales, onChange }: Props) {
  const id = useId();
  const saisie = useSaisie(valeur, decimales, min, max, onChange);
  return (
    <div className="champ">
      <label htmlFor={id} className="champ__libelle">
        {libelle}
      </label>
      <input id={id} className="champ__saisie" {...saisie.proprietes} />
    </div>
  );
}
