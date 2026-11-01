import { type ReactNode, useId } from 'react';
import { fr } from '../i18n/fr';
import { useSaisie } from './useSaisie';

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
  /**
   * Correspondance optionnelle valeur ↔ position de la glissière (ex. échelle logarithmique) ;
   * par défaut, la glissière porte directement la valeur.
   */
  echelle?: { versGlissiere: (v: number) => number; depuisGlissiere: (g: number) => number };
  /** Bornes et pas de la glissière si `echelle` est fournie. */
  glissiere?: { min: number; max: number; pas: number };
  children?: ReactNode;
}

/** Curseur doublé d'une saisie numérique (F-M1-1, F-M2-1). */
export function Curseur(props: Props) {
  const { libelle, unite, valeur, min, max, pas, decimales, onChange, echelle, children } = props;
  const id = useId();
  const saisie = useSaisie(valeur, decimales, min, max, onChange);
  const g = props.glissiere ?? { min, max, pas };
  const position = echelle ? echelle.versGlissiere(valeur) : valeur;

  return (
    <div className="curseur">
      <div className="curseur__entete">
        <label htmlFor={id} className="curseur__libelle">
          {libelle}
        </label>
        <span className="curseur__valeur">
          <input
            className="curseur__saisie"
            aria-label={fr.lancement.saisie(libelle)}
            size={Math.max(4, saisie.affiche.length)}
            {...saisie.proprietes}
          />
          <span className="curseur__unite">{unite}</span>
        </span>
      </div>
      <input
        id={id}
        className="curseur__glissiere"
        type="range"
        min={g.min}
        max={g.max}
        step={g.pas}
        value={position}
        aria-valuetext={`${saisie.affiche} ${unite}`}
        style={
          {
            '--remplissage': `${((position - g.min) / (g.max - g.min)) * 100}%`,
          } as React.CSSProperties
        }
        onChange={(e) => {
          const lu = Number(e.target.value);
          onChange(echelle ? echelle.depuisGlissiere(lu) : lu);
        }}
      />
      {children}
    </div>
  );
}
