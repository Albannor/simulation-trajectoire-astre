import { type ReactNode, useId, useState } from 'react';
import { format, parseNombre } from '../format';
import { fr } from '../i18n/fr';

interface Props {
  libelle: string;
  unite: string;
  /** Valeur en unités d'affichage. */
  valeur: number;
  min: number;
  max: number;
  pas: number;
  decimales: number;
  onChange: (valeur: number) => void;
  children?: ReactNode;
}

/**
 * Curseur doublé d'une saisie numérique (F-M1-1). La saisie accepte « , » ou « . », « - » ou « − » ;
 * elle est validée à la sortie du champ ou par Entrée, bornée, et annulée par Échap ou si invalide.
 */
export function Curseur({
  libelle,
  unite,
  valeur,
  min,
  max,
  pas,
  decimales,
  onChange,
  children,
}: Props) {
  const id = useId();
  // Saisie en cours, liée à la valeur qu'elle remplace : si la valeur change ailleurs (glisser,
  // préréglage), la saisie abandonnée est ignorée.
  const [edition, setEdition] = useState<{ texte: string; base: number } | null>(null);
  const saisie = edition && edition.base === valeur ? edition.texte : null;
  const setSaisie = (texte: string | null) =>
    setEdition(texte === null ? null : { texte, base: valeur });
  const affiche = format(valeur, decimales);

  const valider = () => {
    if (saisie === null) return;
    const lu = parseNombre(saisie);
    setSaisie(null);
    if (lu !== null) onChange(Math.min(max, Math.max(min, lu)));
  };

  return (
    <div className="curseur">
      <div className="curseur__entete">
        <label htmlFor={id} className="curseur__libelle">
          {libelle}
        </label>
        <span className="curseur__valeur">
          <input
            className="curseur__saisie"
            type="text"
            inputMode="decimal"
            aria-label={fr.lancement.saisie(libelle)}
            value={saisie ?? affiche}
            size={Math.max(4, affiche.length)}
            onChange={(e) => setSaisie(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={valider}
            onKeyDown={(e) => {
              if (e.key === 'Enter') valider();
              if (e.key === 'Escape') setSaisie(null);
            }}
          />
          <span className="curseur__unite">{unite}</span>
        </span>
      </div>
      <input
        id={id}
        className="curseur__glissiere"
        type="range"
        min={min}
        max={max}
        step={pas}
        value={valeur}
        aria-valuetext={`${affiche} ${unite}`}
        style={
          { '--remplissage': `${((valeur - min) / (max - min)) * 100}%` } as React.CSSProperties
        }
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {children}
    </div>
  );
}
