import { fr } from '../i18n/fr';
import { Logo } from './Logo';

export type Mode = 'mode1' | 'mode2';

interface EnteteProps {
  mode: Mode;
  onMode: (mode: Mode) => void;
  explications: boolean;
  onExplications: (actif: boolean) => void;
}

export function Entete({ mode, onMode, explications, onExplications }: EnteteProps) {
  return (
    <header className="entete">
      <div className="entete__marque">
        <Logo />
        <h1>{fr.app.titre}</h1>
      </div>

      <div className="selecteur-mode" role="group" aria-label={fr.entete.choixMode}>
        <button type="button" aria-pressed={mode === 'mode1'} onClick={() => onMode('mode1')}>
          {fr.entete.mode1}
        </button>
        <button type="button" aria-pressed={mode === 'mode2'} onClick={() => onMode('mode2')}>
          {fr.entete.mode2}
        </button>
      </div>

      <div className="entete__actions">
        <button
          type="button"
          className="interrupteur"
          role="switch"
          aria-checked={explications}
          onClick={() => onExplications(!explications)}
        >
          {fr.entete.explications}
          <span className="interrupteur__piste" aria-hidden="true" />
        </button>
        <button type="button" className="bouton-rond" aria-label={fr.entete.aide}>
          ?
        </button>
      </div>
    </header>
  );
}
