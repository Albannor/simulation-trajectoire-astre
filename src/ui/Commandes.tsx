import { MULTIPLICATEURS_TEMPS } from '../config';
import { formatMultiplicateur } from '../format';
import { fr } from '../i18n/fr';
import { type Vue } from '../render/vue';
import { actionPrincipale } from '../sim/etats';
import { type SimulationMode1 } from '../sim/simulationMode1';
import {
  IconeLancer,
  IconeMoins,
  IconePas,
  IconePause,
  IconePlus,
  IconeRecentrer,
  IconeRecommencer,
} from './Icones';
import { useVersion } from './useVersion';

interface Props {
  sim: SimulationMode1;
  vue: Vue;
}

export function Commandes({ sim, vue }: Props) {
  useVersion(sim);
  const action = actionPrincipale(sim.etat);

  return (
    <div className="commandes">
      <div className="commandes__groupe">
        <button type="button" className="bouton-principal" onClick={() => sim.basculer()}>
          {action === 'pause' ? (
            <IconePause />
          ) : action === 'lancer' ? (
            <IconeLancer />
          ) : (
            <IconeRecommencer />
          )}
          {fr.commandes[action]}
        </button>
        <button
          type="button"
          className="bouton-rond"
          aria-label={fr.commandes.pasAPas}
          title={fr.commandes.pasAPas}
          disabled={sim.etat === 'terminee'}
          onClick={() => sim.pas()}
        >
          <IconePas />
        </button>
        <button
          type="button"
          className="bouton-rond"
          aria-label={fr.commandes.recommencer}
          title={fr.commandes.recommencer}
          onClick={() => sim.recommencer()}
        >
          <IconeRecommencer />
        </button>
      </div>

      <div className="commandes__groupe">
        <span className="commandes__libelle" id="libelle-vitesse-temps">
          {fr.commandes.vitesseTemps}
        </span>
        <div className="segments" role="group" aria-labelledby="libelle-vitesse-temps">
          {MULTIPLICATEURS_TEMPS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={sim.multiplicateur === m}
              onClick={() => sim.definirMultiplicateur(m)}
            >
              {formatMultiplicateur(m)}
            </button>
          ))}
        </div>
      </div>

      <div className="commandes__groupe" role="group" aria-label={fr.commandes.zoom}>
        <button
          type="button"
          className="bouton-rond"
          aria-label={fr.commandes.zoomMoins}
          title={fr.commandes.zoomMoins}
          onClick={() => vue.zoomMoins()}
        >
          <IconeMoins />
        </button>
        <button
          type="button"
          className="bouton-rond"
          aria-label={fr.commandes.zoomPlus}
          title={fr.commandes.zoomPlus}
          onClick={() => vue.zoomPlus()}
        >
          <IconePlus />
        </button>
        <button type="button" className="bouton-pilule" onClick={() => vue.recentrer()}>
          <IconeRecentrer />
          {fr.commandes.recentrer}
        </button>
      </div>
    </div>
  );
}
