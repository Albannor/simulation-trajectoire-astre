import { useCallback } from 'react';
import { format } from '../format';
import { fr } from '../i18n/fr';
import { mesuresMode1 } from '../physics/mode1';
import { type SimulationMode1 } from '../sim/simulationMode1';
import { useIntervalle } from './useIntervalle';

interface Props {
  sim: SimulationMode1;
}

function Tuile({ titre, valeur, unite }: { titre: string; valeur: string; unite: string }) {
  return (
    <div className="tuile">
      <span className="tuile__titre">{titre}</span>
      <span className="tuile__valeur">
        {valeur} <span className="tuile__unite">{unite}</span>
      </span>
    </div>
  );
}

/** Mesures en direct (F-SIM-6), rafraîchies à MESURES_HZ ; indicateurs de calcul (§ 5.7). */
export function Tuiles({ sim }: Props) {
  const lire = useCallback(() => {
    const m = mesuresMode1(sim.astre);
    return {
      distance: format(m.distance),
      vitesse: format(m.vitesse),
      temps: format(sim.temps),
      ralenti: sim.ralenti,
      precisionCorrecte: sim.precisionCorrecte,
      ecart: `${format(sim.ecartEnergie * 100, 4)} %`,
    };
  }, [sim]);
  const m = useIntervalle(lire);

  return (
    <div className="tuiles">
      <Tuile titre={fr.mesures.distance} valeur={m.distance} unite={fr.unites.distance} />
      <Tuile titre={fr.mesures.vitesse} valeur={m.vitesse} unite={fr.unites.vitesse} />
      <Tuile titre={fr.mesures.temps} valeur={m.temps} unite={fr.unites.temps} />
      <div className="indicateurs">
        <span
          className={`pastille ${m.precisionCorrecte ? 'pastille--ok' : 'pastille--alerte'}`}
          title={fr.mesures.precisionDetail(m.ecart)}
        >
          {m.precisionCorrecte ? fr.mesures.precisionCorrecte : fr.mesures.precisionDegradee}
        </span>
        {m.ralenti && (
          <span className="pastille pastille--alerte" title={fr.mesures.ralentiDetail}>
            {fr.mesures.ralenti}
          </span>
        )}
      </div>
    </div>
  );
}
