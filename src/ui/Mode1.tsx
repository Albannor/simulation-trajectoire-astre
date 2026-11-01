import { useCallback, useEffect, useMemo } from 'react';
import { format } from '../format';
import { fr } from '../i18n/fr';
import { mesuresMode1 } from '../physics/mode1';
import { boiteCadrageMode1 } from '../render/scene1';
import { type Vue } from '../render/vue';
import { type Options, type OptionsMode1 } from '../sim/options';
import { type SimulationMode1 } from '../sim/simulationMode1';
import { BarreAfficher } from './BarreAfficher';
import { BullesScene1 } from './BullesScene1';
import { Commandes } from './Commandes';
import { interactionMode1 } from './interactionMode1';
import { PanneauMode1 } from './PanneauMode1';
import { Tuiles } from './Tuiles';
import { useClavier } from './useClavier';
import { Volet } from './Volet';
import { VueSimulation } from './VueSimulation';

interface Props {
  sim: SimulationMode1;
  vue: Vue;
  options: Options<OptionsMode1>;
}

export function Mode1({ sim, vue, options }: Props) {
  // Cadrage automatique à chaque changement (F-SIM-4).
  useEffect(() => {
    const maj = () =>
      vue.definirBoite(boiteCadrageMode1(sim.depart, sim.elements, sim.classification));
    maj();
    return sim.abonner(maj);
  }, [sim, vue]);

  useClavier(sim, vue);
  const interaction = useMemo(() => interactionMode1(sim, vue, options), [sim, vue, options]);
  const lire = useCallback(() => {
    const m = mesuresMode1(sim.astre);
    return [
      { titre: fr.mesures.distance, valeur: format(m.distance), unite: fr.unites.distance },
      { titre: fr.mesures.vitesse, valeur: format(m.vitesse), unite: fr.unites.vitesse },
      { titre: fr.mesures.temps, valeur: format(sim.temps), unite: fr.unites.temps },
    ];
  }, [sim]);

  return (
    <div className="disposition">
      <section className="colonne-simulation" aria-label={fr.entete.mode1}>
        <BarreAfficher sim={sim} options={options} />
        <Tuiles sim={sim} lire={lire} />
        <VueSimulation sim={sim} vue={vue} interaction={interaction}>
          <BullesScene1 sim={sim} options={options} />
        </VueSimulation>
        <Commandes sim={sim} vue={vue} />
      </section>
      <Volet titre={fr.lancement.titre}>
        <PanneauMode1 sim={sim} options={options} />
      </Volet>
    </div>
  );
}
