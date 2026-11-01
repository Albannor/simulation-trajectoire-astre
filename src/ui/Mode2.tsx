import { useCallback, useEffect, useMemo, useRef } from 'react';
import { format } from '../format';
import { fr } from '../i18n/fr';
import { sub } from '../physics/vec2';
import { boiteCadrageMode2 } from '../render/scene2';
import { type Vue } from '../render/vue';
import { type Options, type OptionsMode2 } from '../sim/options';
import { type SimulationMode2 } from '../sim/simulationMode2';
import { BarreAfficherMode2 } from './BarreAfficherMode2';
import { Commandes } from './Commandes';
import { interactionMode2 } from './interactionMode2';
import { PanneauMode2 } from './PanneauMode2';
import { Tuiles } from './Tuiles';
import { useClavier } from './useClavier';
import { Volet } from './Volet';
import { VueSimulation } from './VueSimulation';

interface Props {
  sim: SimulationMode2;
  vue: Vue;
  options: Options<OptionsMode2>;
}

export function Mode2({ sim, vue, options }: Props) {
  // Cadrage automatique (F-SIM-4) ; un nouveau point de vue est une nouvelle scène : on recentre (D-26).
  const vuePrecedente = useRef(options.valeurs.pointDeVue);
  useEffect(() => {
    const maj = () => {
      vue.definirBoite(boiteCadrageMode2(sim, options.valeurs.pointDeVue));
      if (options.valeurs.pointDeVue !== vuePrecedente.current) {
        vuePrecedente.current = options.valeurs.pointDeVue;
        vue.recentrer();
      }
    };
    maj();
    const a = sim.abonner(maj);
    const b = options.abonner(maj);
    return () => {
      a();
      b();
    };
  }, [sim, vue, options]);

  useClavier(sim, vue);
  const interaction = useMemo(() => interactionMode2(sim, vue, options), [sim, vue, options]);
  const lire = useCallback(() => {
    const { a, b } = sim.corps;
    const d = sub(b.r, a.r);
    const v = sub(b.v, a.v);
    return [
      {
        titre: fr.mesures2.distance,
        valeur: format(Math.hypot(d.x, d.y)),
        unite: fr.unites.distance,
      },
      {
        titre: fr.mesures2.vitesse,
        valeur: format(Math.hypot(v.x, v.y)),
        unite: fr.unites.vitesse,
      },
      { titre: fr.mesures.temps, valeur: format(sim.temps), unite: fr.unites.temps },
    ];
  }, [sim]);

  return (
    <div className="disposition">
      <section className="colonne-simulation" aria-label={fr.entete.mode2}>
        <BarreAfficherMode2 sim={sim} options={options} />
        <Tuiles sim={sim} lire={lire} />
        <VueSimulation sim={sim} vue={vue} interaction={interaction} />
        <Commandes sim={sim} vue={vue} />
      </section>
      <Volet titre={fr.lancement.titre}>
        <PanneauMode2 sim={sim} options={options} />
      </Volet>
    </div>
  );
}
