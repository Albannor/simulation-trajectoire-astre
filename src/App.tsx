import { useEffect, useState } from 'react';
import { MULTIPLICATEUR_TEMPS_DEFAUT } from './config';
import { type Mode } from './mode';
import { Vue } from './render/vue';
import { DEFAUT_MODE1, DEFAUT_MODE2 } from './sim/defauts';
import { OPTIONS_MODE1_DEFAUT, OPTIONS_MODE2_DEFAUT, Options } from './sim/options';
import { SimulationMode1 } from './sim/simulationMode1';
import { SimulationMode2 } from './sim/simulationMode2';
import { ecrireMemoire, lireMemoire, stockageNavigateur } from './storage';
import { Aide } from './ui/Aide';
import { Entete } from './ui/Entete';
import { ContexteExplications } from './ui/explications';
import { Mode1 } from './ui/Mode1';
import { Mode2 } from './ui/Mode2';

/** Délai de regroupement des écritures en mémoire locale (ms). */
const DELAI_ECRITURE_MS = 400;

export function App() {
  // Dernier réglage mémorisé (F-APP-3) ; valeurs par défaut pour tout champ absent ou invalide.
  const [memoire] = useState(() => lireMemoire(stockageNavigateur()));
  const multiplicateur = memoire.multiplicateur ?? MULTIPLICATEUR_TEMPS_DEFAUT;
  const [mode, setMode] = useState<Mode>(memoire.mode ?? 'mode1');
  const [explications, setExplications] = useState(memoire.explications ?? false);
  const [aideOuverte, setAideOuverte] = useState(false);
  // Les simulations vivent au-dessus des modes : changer de mode conserve les réglages (F-APP-1).
  const [sim1] = useState(() => new SimulationMode1(memoire.mode1 ?? DEFAUT_MODE1, multiplicateur));
  const [vue1] = useState(() => new Vue());
  const [options1] = useState(() => new Options(OPTIONS_MODE1_DEFAUT));
  const [sim2] = useState(() => new SimulationMode2(memoire.mode2 ?? DEFAUT_MODE2, multiplicateur));
  const [vue2] = useState(() => new Vue());
  const [options2] = useState(() => new Options(OPTIONS_MODE2_DEFAUT));

  // Une seule vitesse du temps pour les deux modes (D-30).
  useEffect(() => {
    const suivre = (source: SimulationMode1 | SimulationMode2, cible: typeof source) => () => {
      if (cible.multiplicateur !== source.multiplicateur) {
        cible.definirMultiplicateur(source.multiplicateur);
      }
    };
    const a = sim1.abonner(suivre(sim1, sim2));
    const b = sim2.abonner(suivre(sim2, sim1));
    return () => {
      a();
      b();
    };
  }, [sim1, sim2]);

  // Écriture regroupée à chaque changement, et immédiate quand la page se ferme.
  useEffect(() => {
    const stockage = stockageNavigateur();
    let minuterie = 0;
    const ecrire = () =>
      ecrireMemoire(stockage, {
        mode,
        explications,
        mode1: sim1.reglages,
        mode2: sim2.reglages,
        multiplicateur: sim1.multiplicateur,
      });
    const planifier = () => {
      window.clearTimeout(minuterie);
      minuterie = window.setTimeout(ecrire, DELAI_ECRITURE_MS);
    };
    planifier();
    const a = sim1.abonner(planifier);
    const b = sim2.abonner(planifier);
    window.addEventListener('pagehide', ecrire);
    return () => {
      window.clearTimeout(minuterie);
      window.removeEventListener('pagehide', ecrire);
      a();
      b();
    };
  }, [mode, explications, sim1, sim2]);

  return (
    <ContexteExplications.Provider value={explications}>
      <div className="app">
        <Entete
          mode={mode}
          onMode={setMode}
          explications={explications}
          onExplications={setExplications}
          onAide={() => setAideOuverte(true)}
        />
        <main className="contenu">
          {mode === 'mode1' ? (
            <Mode1 sim={sim1} vue={vue1} options={options1} />
          ) : (
            <Mode2 sim={sim2} vue={vue2} options={options2} />
          )}
        </main>
        <Aide ouverte={aideOuverte} onFermer={() => setAideOuverte(false)} />
      </div>
    </ContexteExplications.Provider>
  );
}
