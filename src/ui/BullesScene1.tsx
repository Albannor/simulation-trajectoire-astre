import { formatAngle } from '../format';
import { fr } from '../i18n/fr';
import { type Options, type OptionsMode1 } from '../sim/options';
import { type SimulationMode1 } from '../sim/simulationMode1';
import { Bulle } from './Bulle';
import { useVersion } from './useVersion';

interface Props {
  sim: SimulationMode1;
  options: Options<OptionsMode1>;
}

/**
 * Bulles superposées à la simulation (maquette 2, décision D-28) : énergie de l'orbite en haut
 * (ellipse/cercle ou hyperbole), asymptotes et déviation en bas (hyperbole, asymptotes affichées).
 */
export function BullesScene1({ sim, options }: Props) {
  useVersion(sim);
  useVersion(options);
  const cl = sim.classification;
  if (cl.type !== 'conique') return null;
  const liee = cl.forme === 'cercle' || cl.forme === 'ellipse';
  const hyperbole = cl.forme === 'hyperbole';
  return (
    <>
      {liee && <Bulle surScene="haut">{fr.bulles.ellipse}</Bulle>}
      {hyperbole && <Bulle surScene="haut">{fr.bulles.hyperbole}</Bulle>}
      {hyperbole && options.valeurs.asymptotes && sim.elements.deviation !== null && (
        <Bulle surScene="bas">{fr.bulles.asymptotes(formatAngle(sim.elements.deviation))}</Bulle>
      )}
    </>
  );
}
