import { useEffect } from 'react';
import { type Vue } from '../render/vue';
import { type SimulationBase } from '../sim/simulationBase';

/** Raccourcis clavier (F-APP-6), ignorés pendant une saisie et sur un bouton pour Espace (D-21). */
export function useClavier(sim: SimulationBase<unknown, string>, vue: Vue): void {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (cible?.closest('input, textarea, select, [contenteditable="true"]')) return;
      switch (e.key) {
        case ' ':
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
