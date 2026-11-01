import { type ReactNode } from 'react';
import { fr } from '../i18n/fr';
import { useExplications } from './explications';

interface Props {
  children: ReactNode;
  /** Bulle superposée à la simulation (maquette 2) plutôt que dans le panneau. */
  surScene?: 'haut' | 'bas';
}

/** Bulle d'explication (§ 6.7), affichée seulement si « Explications » est activé. */
export function Bulle({ children, surScene }: Props) {
  if (!useExplications()) return null;
  return (
    <aside
      className={`bulle ${surScene ? `bulle--scene bulle--${surScene}` : ''}`}
      role="note"
      aria-label={fr.bulles.icone}
    >
      <span className="bulle__icone" aria-hidden="true">
        ?
      </span>
      <p className="bulle__texte">{children}</p>
    </aside>
  );
}
