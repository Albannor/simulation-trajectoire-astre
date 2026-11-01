import { type ReactNode, useId, useState } from 'react';
import { fr } from '../i18n/fr';

interface Props {
  titre: string;
  children: ReactNode;
}

/**
 * Panneau de réglages : colonne de droite sur ordinateur ; volet en bas sur tablette, déplié
 * par défaut et repliable par sa poignée (§ 7.1). La poignée n'est visible que sur tablette.
 */
export function Volet({ titre, children }: Props) {
  const id = useId();
  const [replie, setReplie] = useState(false);
  return (
    <aside className="panneau" aria-label={titre} data-replie={replie}>
      <button
        type="button"
        className="poignee"
        aria-expanded={!replie}
        aria-controls={id}
        onClick={() => setReplie(!replie)}
      >
        <span className="poignee__barre" aria-hidden="true" />
        <span className="poignee__texte">{replie ? fr.volet.deplier : fr.volet.replier}</span>
      </button>
      <div id={id} className="panneau__contenu">
        {children}
      </div>
    </aside>
  );
}
