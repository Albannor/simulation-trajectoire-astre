import { type ReactNode, useId, useState } from 'react';

interface Props {
  /** Nom accessible du bouton. */
  libelle: string;
  /** Contenu visible du bouton (par défaut « i »). */
  contenu?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Information ouverte au toucher ou au clavier, et non au seul survol (§ 7.1) : un bouton qui
 * affiche ou masque un court texte juste en dessous.
 */
export function InfoBouton({ libelle, contenu = 'i', className = 'bouton-info', children }: Props) {
  const id = useId();
  const [ouvert, setOuvert] = useState(false);
  return (
    <span className="info">
      <button
        type="button"
        className={className}
        aria-label={typeof contenu === 'string' && contenu !== 'i' ? undefined : libelle}
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={() => setOuvert(!ouvert)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOuvert(false);
        }}
      >
        {contenu}
      </button>
      <span id={id} className="info__texte" role="note" hidden={!ouvert}>
        {children}
      </span>
    </span>
  );
}
