import { useState } from 'react';
import { MULTIPLICATEUR_TEMPS_DEFAUT } from './config';
import { Vue } from './render/vue';
import { DEFAUT_MODE1, DEFAUT_MODE2 } from './sim/defauts';
import { OPTIONS_MODE1_DEFAUT, OPTIONS_MODE2_DEFAUT, Options } from './sim/options';
import { SimulationMode1 } from './sim/simulationMode1';
import { SimulationMode2 } from './sim/simulationMode2';
import { Entete, type Mode } from './ui/Entete';
import { Mode1 } from './ui/Mode1';
import { Mode2 } from './ui/Mode2';

export function App() {
  const [mode, setMode] = useState<Mode>('mode1');
  const [explications, setExplications] = useState(false);
  // Les simulations vivent au-dessus des modes : changer de mode conserve les réglages (F-APP-1).
  const [sim1] = useState(() => new SimulationMode1(DEFAUT_MODE1, MULTIPLICATEUR_TEMPS_DEFAUT));
  const [vue1] = useState(() => new Vue());
  const [options1] = useState(() => new Options(OPTIONS_MODE1_DEFAUT));
  const [sim2] = useState(() => new SimulationMode2(DEFAUT_MODE2, MULTIPLICATEUR_TEMPS_DEFAUT));
  const [vue2] = useState(() => new Vue());
  const [options2] = useState(() => new Options(OPTIONS_MODE2_DEFAUT));

  return (
    <div className="app">
      <Entete
        mode={mode}
        onMode={setMode}
        explications={explications}
        onExplications={setExplications}
      />
      <main className="contenu">
        {mode === 'mode1' ? (
          <Mode1 sim={sim1} vue={vue1} options={options1} />
        ) : (
          <Mode2 sim={sim2} vue={vue2} options={options2} />
        )}
      </main>
    </div>
  );
}
