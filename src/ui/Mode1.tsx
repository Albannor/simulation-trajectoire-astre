import { useEffect } from 'react';
import { fr } from '../i18n/fr';
import { boiteCadrageMode1 } from '../render/scene1';
import { type Vue } from '../render/vue';
import { type Options, type OptionsMode1 } from '../sim/options';
import { type SimulationMode1 } from '../sim/simulationMode1';
import { BarreAfficher } from './BarreAfficher';
import { Commandes } from './Commandes';
import { PanneauMode1 } from './PanneauMode1';
import { Tuiles } from './Tuiles';
import { VueSimulation } from './VueSimulation';

/** Raccourcis clavier (F-APP-6), ignorés pendant une saisie. */
function useClavier(sim: SimulationMode1, vue: Vue): void {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (cible?.closest('input, textarea, select, [contenteditable="true"]')) return;
      switch (e.key) {
        case ' ':
          // Sur un bouton, Espace garde son rôle natif (l'activer).
          if (cible?.closest('button')) return;
          e.preventDefault();
          sim.basculer();
          break;
        case 'r':
        case 'R':
          sim.recommencer();
          break;
        case '+':
        case '=':
          vue.zoomPlus();
          break;
        case '-':
        case '−':
          vue.zoomMoins();
          break;
        case '0':
          vue.recentrer();
          break;
      }
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [sim, vue]);
}

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

  return (
    <div className="disposition">
      <section className="colonne-simulation" aria-label={fr.entete.mode1}>
        <BarreAfficher sim={sim} options={options} />
        <Tuiles sim={sim} />
        <VueSimulation sim={sim} vue={vue} options={options} />
        <Commandes sim={sim} vue={vue} />
      </section>
      <aside className="panneau" aria-label={fr.lancement.titre}>
        <PanneauMode1 sim={sim} options={options} />
      </aside>
    </div>
  );
}
