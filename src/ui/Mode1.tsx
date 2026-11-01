import { useEffect } from 'react';
import { fr } from '../i18n/fr';
import { presetMode1 } from '../physics/presets';
import { boiteCadrageMode1 } from '../render/scene1';
import { type Vue } from '../render/vue';
import { DEFAUT_MODE1 } from '../sim/defauts';
import { type SimulationMode1 } from '../sim/simulationMode1';
import { Commandes } from './Commandes';
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
}

export function Mode1({ sim, vue }: Props) {
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
        <Tuiles sim={sim} />
        <VueSimulation sim={sim} vue={vue} />
        <Commandes sim={sim} vue={vue} />
      </section>
      <aside className="panneau">
        <h2>{fr.provisoire.titre}</h2>
        <div className="pilules">
          <button
            type="button"
            className="bouton-pilule"
            onClick={() => sim.modifierReglages(presetMode1('terre', sim.reglages))}
          >
            {fr.provisoire.terre}
          </button>
          <button
            type="button"
            className="bouton-pilule"
            onClick={() => sim.modifierReglages(DEFAUT_MODE1)}
          >
            {fr.provisoire.ellipse}
          </button>
        </div>
        <p className="note">{fr.provisoire.note}</p>
      </aside>
    </div>
  );
}
