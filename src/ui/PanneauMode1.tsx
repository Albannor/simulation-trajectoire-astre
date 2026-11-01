import {
  PAS_R0,
  PAS_THETA_DEG,
  PAS_V0,
  R0_MAX,
  R0_MIN,
  THETA_MAX_DEG,
  THETA_MIN_DEG,
  V0_MAX,
  V0_MIN,
} from '../config';
import { format, formatAngle, formatExcentricite } from '../format';
import { fr } from '../i18n/fr';
import { degToRad, radToDeg } from '../physics/constants';
import { positionJauge, vCirc, vLib } from '../physics/kepler';
import {
  type ReglagesMode1,
  calerCirculaire,
  calerLiberation,
  verdictLiberation,
} from '../physics/mode1';
import { type NomPresetMode1, presetMode1 } from '../physics/presets';
import { type Options, type OptionsMode1 } from '../sim/options';
import { type SimulationMode1 } from '../sim/simulationMode1';
import { Bulle } from './Bulle';
import { SectionPresets } from './SectionPresets';
import { Curseur } from './Curseur';
import { InfoBouton } from './InfoBouton';
import { Jauge } from './Jauge';
import { useVersion } from './useVersion';

interface Props {
  sim: SimulationMode1;
  options: Options<OptionsMode1>;
}

const PRESETS: NomPresetMode1[] = [
  'terre',
  'mars',
  'halley',
  'cometeHyperbolique',
  'orbiteCirculaire',
  'parabole',
];

/** Écart minimal (fraction de la glissière) sous lequel les deux repères passent sur deux lignes. */
const ECART_REPERES_UNE_LIGNE = 0.3;

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function Mesure({ titre, valeur, unite }: { titre: string; valeur: string; unite: string }) {
  return (
    <div className="mesure">
      <span className="mesure__titre">{titre}</span>
      <span className="mesure__valeur">
        {valeur} <span className="mesure__unite">{unite}</span>
      </span>
    </div>
  );
}

/** Repères « circulaire » et « libération » sous le curseur de vitesse (F-M1-3). */
function ReperesVitesse({
  r0,
  onCaler,
}: {
  r0: number;
  onCaler: (repere: 'circulaire' | 'liberation') => void;
}) {
  const reperes = [
    { cle: 'circulaire', v: vCirc(r0), aide: fr.lancement.repereCirculaire },
    { cle: 'liberation', v: vLib(r0), aide: fr.lancement.repereLiberation },
  ] as const;
  const visibles = reperes.filter((r) => r.v <= V0_MAX);
  const [a, b] = visibles;
  const deuxLignes = a && b && (b.v - a.v) / V0_MAX < ECART_REPERES_UNE_LIGNE;
  return (
    <div className={`reperes ${deuxLignes ? 'reperes--deux-lignes' : ''}`}>
      {visibles.map((r, i) => (
        <button
          key={r.cle}
          type="button"
          className={`repere repere--${r.cle} ${deuxLignes && i === 1 ? 'repere--bas' : ''}`}
          style={{ left: `${(r.v / V0_MAX) * 100}%` }}
          aria-label={r.aide(format(r.v))}
          onClick={() => onCaler(r.cle)}
        >
          {fr.lancement[r.cle]} {format(r.v)}
        </button>
      ))}
    </div>
  );
}

export function PanneauMode1({ sim, options }: Props) {
  useVersion(sim);
  useVersion(options);
  const reg = sim.reglages;
  const { elements: el, classification: cl } = sim;
  const modifier = (r: Partial<ReglagesMode1>) => sim.modifierReglages({ ...reg, ...r });

  return (
    <>
      <SectionPresets titre={fr.presets1.titre}>
        <div className="pilules">
          {PRESETS.map((nom) => (
            <button
              key={nom}
              type="button"
              className="bouton-pilule"
              onClick={() => sim.modifierReglages(presetMode1(nom, reg))}
            >
              {fr.presets1[nom]}
            </button>
          ))}
        </div>
      </SectionPresets>

      <section className="section-panneau" aria-labelledby="titre-lancement">
        <h2 id="titre-lancement">{fr.lancement.titre}</h2>
        <Curseur
          libelle={fr.lancement.distance}
          unite={fr.unites.distance}
          valeur={reg.r0}
          min={R0_MIN}
          max={R0_MAX}
          pas={PAS_R0}
          decimales={2}
          onChange={(r0) => modifier({ r0 })}
        >
          <p className="aide">{fr.lancement.rappelDistance}</p>
        </Curseur>

        <Curseur
          libelle={fr.lancement.vitesse}
          unite={fr.unites.vitesse}
          valeur={reg.v0}
          min={V0_MIN}
          max={V0_MAX}
          pas={PAS_V0}
          decimales={2}
          onChange={(v0) => modifier({ v0 })}
        >
          <ReperesVitesse
            r0={reg.r0}
            onCaler={(repere) =>
              sim.modifierReglages(
                repere === 'circulaire' ? calerCirculaire(reg) : calerLiberation(reg),
              )
            }
          />
          <div className="ligne-aide">
            <p className="aide">{fr.lancement.rappelTerre}</p>
            <button
              type="button"
              role="switch"
              className="interrupteur interrupteur--petit"
              aria-checked={options.valeurs.aimant}
              onClick={() => options.definir('aimant', !options.valeurs.aimant)}
            >
              {fr.lancement.aimant}
              <span className="interrupteur__piste" aria-hidden="true" />
            </button>
            <InfoBouton libelle={fr.lancement.aimantInfo}>{fr.lancement.aimantDetail}</InfoBouton>
          </div>
          <Bulle>
            {fr.bulles.liberation(format(vLib(reg.r0)), format(reg.v0), verdictLiberation(reg, cl))}
          </Bulle>
        </Curseur>

        <Curseur
          libelle={fr.lancement.direction}
          unite={fr.unites.degre}
          valeur={Math.round(radToDeg(reg.theta))}
          min={THETA_MIN_DEG}
          max={THETA_MAX_DEG}
          pas={PAS_THETA_DEG}
          decimales={0}
          onChange={(deg) => modifier({ theta: degToRad(deg) })}
        >
          <div className="ligne-aide">
            <p className="aide">{fr.lancement.rappelDirection}</p>
            <div className="sens" role="group" aria-label={fr.lancement.sens}>
              <button
                type="button"
                aria-pressed={reg.sens === 1}
                aria-label={fr.lancement.antiHoraire}
                title={fr.lancement.antiHoraire}
                onClick={() => modifier({ sens: 1 })}
              >
                ↺
              </button>
              <button
                type="button"
                aria-pressed={reg.sens === -1}
                aria-label={fr.lancement.horaire}
                title={fr.lancement.horaire}
                onClick={() => modifier({ sens: -1 })}
              >
                ↻
              </button>
            </div>
          </div>
        </Curseur>
        <p className="aide">{fr.lancement.gestes}</p>
      </section>

      <section className="carte carte-forme" aria-labelledby="titre-forme">
        <h2 id="titre-forme">{fr.forme.titre}</h2>
        {cl.type === 'droite' ? (
          <p className="forme forme--droite" aria-live="polite">
            <span className="forme__nom">{fr.forme.droite}</span>
            <span className="forme__detail">
              {
                {
                  tombe: fr.formes.droiteTombe,
                  retombe: fr.formes.droiteRetombe,
                  part: fr.formes.droitePart,
                }[cl.issue]
              }
            </span>
          </p>
        ) : (
          <>
            <p className={`forme forme--${cl.forme}`}>
              <span className="forme__nom" aria-live="polite">
                {majuscule(fr.formes[cl.forme])}
                {cl.presque && <span className="forme__presque"> ({fr.forme.presque})</span>}
              </span>
              <span className="forme__e">
                {fr.forme.excentricite} e = {formatExcentricite(el.e)}
              </span>
            </p>
            <Jauge
              forme={cl.forme}
              position={positionJauge(cl, el.e)}
              description={fr.forme.jauge(fr.formes[cl.forme], formatExcentricite(el.e))}
            />
            <Bulle>{fr.bulles.forme}</Bulle>
          </>
        )}
        {cl.collision && (
          <p className="avertissement" role="status">
            <span aria-hidden="true">⚠ </span>
            {fr.forme.collision}
          </p>
        )}
      </section>

      {cl.type === 'conique' && (
        <section className="section-panneau" aria-labelledby="titre-mesures">
          <h2 id="titre-mesures">{fr.mesuresOrbite.titre}</h2>
          <div className="mesures">
            {(cl.forme === 'cercle' || cl.forme === 'ellipse') && (
              <>
                <Mesure
                  titre={fr.mesuresOrbite.demiGrandAxe}
                  valeur={format(el.a)}
                  unite={fr.unites.distance}
                />
                <Mesure
                  titre={fr.mesuresOrbite.periode}
                  valeur={format(el.periode ?? Number.NaN)}
                  unite={fr.unites.temps}
                />
                <Mesure
                  titre={fr.mesuresOrbite.perihelie}
                  valeur={format(el.rp)}
                  unite={fr.unites.distance}
                />
                <Mesure
                  titre={fr.mesuresOrbite.aphelie}
                  valeur={format(el.ra ?? Number.NaN)}
                  unite={fr.unites.distance}
                />
              </>
            )}
            {cl.forme === 'parabole' && (
              <>
                <Mesure
                  titre={fr.mesuresOrbite.perihelie}
                  valeur={format(el.rp)}
                  unite={fr.unites.distance}
                />
                <Mesure
                  titre={fr.mesuresOrbite.vitesseLoin}
                  valeur={format(0)}
                  unite={fr.unites.vitesse}
                />
              </>
            )}
            {cl.forme === 'hyperbole' && (
              <>
                <Mesure
                  titre={fr.mesuresOrbite.demiGrandAxe}
                  valeur={format(Math.abs(el.a))}
                  unite={fr.unites.distance}
                />
                <Mesure
                  titre={fr.mesuresOrbite.perihelie}
                  valeur={format(el.rp)}
                  unite={fr.unites.distance}
                />
                <Mesure
                  titre={fr.mesuresOrbite.vitesseLoin}
                  valeur={format(el.vInfini ?? Number.NaN)}
                  unite={fr.unites.vitesse}
                />
                <Mesure
                  titre={fr.mesuresOrbite.deviation}
                  valeur={formatAngle(el.deviation ?? Number.NaN)}
                  unite={fr.unites.degre}
                />
              </>
            )}
          </div>
          {options.valeurs.perihelieAphelie && cl.forme !== 'cercle' && (
            <Bulle>
              {cl.forme === 'ellipse'
                ? fr.bulles.perihelieAphelie
                : fr.bulles.perihelieOrbiteOuverte}
            </Bulle>
          )}
          {options.valeurs.loiDesAires && <Bulle>{fr.bulles.loiDesAires}</Bulle>}
        </section>
      )}
    </>
  );
}
