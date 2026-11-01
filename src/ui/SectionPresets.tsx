import { type ReactNode, useId, useState } from 'react';
import { fr } from '../i18n/fr';

interface Props {
  titre: string;
  children: ReactNode;
}

/**
 * Section des préréglages. Sur tablette, elle s'ouvre par le bouton « Préréglages » (maquette 4,
 * décision D-09) ; sur ordinateur, elle est toujours visible (le bouton est masqué).
 */
export function SectionPresets({ titre, children }: Props) {
  const id = useId();
  const [ouverte, setOuverte] = useState(false);
  return (
    <section className="section-panneau section-presets" data-ouverte={ouverte} aria-label={titre}>
      <button
        type="button"
        className="bouton-pilule bouton-presets"
        aria-expanded={ouverte}
        aria-controls={id}
        onClick={() => setOuverte(!ouverte)}
      >
        {fr.volet.preReglages}
      </button>
      <div id={id} className="section-presets__contenu">
        <h2>{titre}</h2>
        {children}
      </div>
    </section>
  );
}
