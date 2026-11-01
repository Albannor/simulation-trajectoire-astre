import { useCallback } from 'react';
import { format } from '../format';
import { fr } from '../i18n/fr';
import { type SimulationBase } from '../sim/simulationBase';
import { InfoBouton } from './InfoBouton';
import { useIntervalle } from './useIntervalle';

export interface MesureTuile {
  readonly titre: string;
  readonly valeur: string;
  readonly unite: string;
}

interface Props {
  sim: SimulationBase<unknown, string>;
  /** Mesures en direct du mode ; doit être stable (useCallback). */
  lire: () => readonly MesureTuile[];
}

/** Mesures en direct (F-SIM-6), rafraîchies à MESURES_HZ ; indicateurs de calcul (§ 5.7). */
export function Tuiles({ sim, lire }: Props) {
  const lireTout = useCallback(
    () => ({
      tuiles: lire(),
      ralenti: sim.ralenti,
      precisionCorrecte: sim.precisionCorrecte,
      ecart: `${format(sim.ecartEnergie * 100, 4)} %`,
    }),
    [sim, lire],
  );
  const m = useIntervalle(lireTout);

  return (
    <div className="tuiles">
      {m.tuiles.map((t) => (
        <div className="tuile" key={t.titre}>
          <span className="tuile__titre">{t.titre}</span>
          <span className="tuile__valeur">
            {t.valeur} <span className="tuile__unite">{t.unite}</span>
          </span>
        </div>
      ))}
      <div className="indicateurs">
        <InfoBouton
          libelle={fr.mesures.precisionCorrecte}
          contenu={
            m.precisionCorrecte ? fr.mesures.precisionCorrecte : fr.mesures.precisionDegradee
          }
          className={`pastille ${m.precisionCorrecte ? 'pastille--ok' : 'pastille--alerte'}`}
        >
          {fr.mesures.precisionDetail(m.ecart)}
        </InfoBouton>
        {m.ralenti && (
          <InfoBouton
            libelle={fr.mesures.ralenti}
            contenu={fr.mesures.ralenti}
            className="pastille pastille--alerte"
          >
            {fr.mesures.ralentiDetail}
          </InfoBouton>
        )}
      </div>
    </div>
  );
}
