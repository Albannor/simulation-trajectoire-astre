import { useState } from 'react';
import { fr } from './i18n/fr';
import { Entete, type Mode } from './ui/Entete';

export function App() {
  const [mode, setMode] = useState<Mode>('mode1');
  const [explications, setExplications] = useState(false);

  return (
    <div className="app">
      <Entete
        mode={mode}
        onMode={setMode}
        explications={explications}
        onExplications={setExplications}
      />
      <main className="contenu">
        <p>{mode === 'mode1' ? fr.entete.mode1 : fr.entete.mode2}</p>
      </main>
    </div>
  );
}
