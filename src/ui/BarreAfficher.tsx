import { fr } from '../i18n/fr';
import { type Options, type OptionsMode1 } from '../sim/options';
import { type SimulationMode1 } from '../sim/simulationMode1';
import { useVersion } from './useVersion';

interface Props {
  sim: SimulationMode1;
  options: Options<OptionsMode1>;
}

type CleAffichage = Exclude<keyof OptionsMode1, 'aimant'>;

/** Barre « Afficher » (F-M1-7) et « Effacer les traces » (F-APP-5, § 11 point 2). */
export function BarreAfficher({ sim, options }: Props) {
  useVersion(sim);
  useVersion(options);
  const cl = sim.classification;
  const ouverte = cl.type === 'conique' && (cl.forme === 'parabole' || cl.forme === 'hyperbole');
  const hyperbole = cl.type === 'conique' && cl.forme === 'hyperbole';

  const boutons: { cle: CleAffichage; libelle: string; visible: boolean }[] = [
    { cle: 'orbitePrevue', libelle: fr.afficher.orbitePrevue, visible: true },
    {
      cle: 'perihelieAphelie',
      libelle: ouverte ? fr.afficher.perihelie : fr.afficher.perihelieAphelie,
      visible: true,
    },
    { cle: 'asymptotes', libelle: fr.afficher.asymptotes, visible: hyperbole },
    { cle: 'foyers', libelle: fr.afficher.foyers, visible: true },
    { cle: 'cercleReference', libelle: fr.afficher.cercleReference, visible: true },
    { cle: 'loiDesAires', libelle: fr.afficher.loiDesAires, visible: true },
  ];

  return (
    <div className="barre-afficher" role="group" aria-labelledby="titre-afficher">
      <span id="titre-afficher" className="barre-afficher__titre">
        {fr.afficher.titre}
      </span>
      {boutons
        .filter((b) => b.visible)
        .map((b) => (
          <button
            key={b.cle}
            type="button"
            className="bascule"
            aria-pressed={options.valeurs[b.cle]}
            onClick={() => options.definir(b.cle, !options.valeurs[b.cle])}
          >
            {b.libelle}
          </button>
        ))}
      <button
        type="button"
        className="bascule bascule--action"
        disabled={sim.trace.longueur === 0 && sim.anciennesTraces.length === 0}
        onClick={() => sim.effacerTraces()}
      >
        {fr.afficher.effacerTraces}
      </button>
    </div>
  );
}
