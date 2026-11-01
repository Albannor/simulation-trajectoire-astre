import { useState } from 'react';
import { fr } from '../i18n/fr';
import { type Options, type OptionsMode2 } from '../sim/options';
import { type SimulationMode2 } from '../sim/simulationMode2';
import { useVersion } from './useVersion';

interface Props {
  sim: SimulationMode2;
  options: Options<OptionsMode2>;
}

type CleAffichage = Exclude<keyof OptionsMode2, 'pointDeVue'>;

const BOUTONS: CleAffichage[] = [
  'orbitesPrevues',
  'trainees',
  'centreDeMasse',
  'ligneAB',
  'flechesVitesse',
];

/** Barre « Afficher » du mode 2 (F-M2-3) et « Effacer les traces » (F-APP-5). */
export function BarreAfficherMode2({ sim, options }: Props) {
  useVersion(sim);
  useVersion(options);
  // § 5.6 : en vue fixe avec V_cm ≠ 0, l'orbite prévue n'est pas statique : bouton grisé.
  const orbitesIndisponibles = options.valeurs.pointDeVue === 'fixe' && sim.derive;
  // L'explication s'affiche au toucher ou au clavier, pas seulement au survol (§ 7.1).
  const [explique, setExplique] = useState(false);

  return (
    <div className="barre-afficher" role="group" aria-labelledby="titre-afficher2">
      <span id="titre-afficher2" className="barre-afficher__titre">
        {fr.afficher.titre}
      </span>
      {BOUTONS.map((cle) => {
        const indisponible = cle === 'orbitesPrevues' && orbitesIndisponibles;
        return (
          <button
            key={cle}
            type="button"
            className="bascule"
            aria-pressed={!indisponible && options.valeurs[cle]}
            aria-disabled={indisponible || undefined}
            aria-description={indisponible ? fr.afficher2.orbitesMasquees : undefined}
            title={indisponible ? fr.afficher2.orbitesMasquees : undefined}
            onClick={() => {
              if (indisponible) setExplique(!explique);
              else options.definir(cle, !options.valeurs[cle]);
            }}
          >
            {fr.afficher2[cle]}
          </button>
        );
      })}
      <button
        type="button"
        className="bascule bascule--action"
        disabled={sim.trace.longueur === 0 && sim.anciennesTraces.length === 0}
        onClick={() => sim.effacerTraces()}
      >
        {fr.afficher.effacerTraces}
      </button>
      {orbitesIndisponibles && explique && (
        <p className="info__texte info__texte--ligne" role="status">
          {fr.afficher2.orbitesMasquees}
        </p>
      )}
    </div>
  );
}
