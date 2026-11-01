import { useState } from 'react';
import { MASSE_MAX, MASSE_MIN, POSITION_MAX_MODE2, VITESSE_MAX_MODE2 } from '../config';
import { format, formatExcentricite, formatFacteur } from '../format';
import { fr } from '../i18n/fr';
import { type CorpsMode2, rapportMasses } from '../physics/mode2';
import { type NomPresetMode2, presetMode2 } from '../physics/presets';
import { type NomCorps, type PointDeVue } from '../render/referentiel';
import { type Options, type OptionsMode2 } from '../sim/options';
import { type SimulationMode2 } from '../sim/simulationMode2';
import { Bulle } from './Bulle';
import { ChampNombre } from './ChampNombre';
import { Curseur } from './Curseur';
import { useVersion } from './useVersion';

interface Props {
  sim: SimulationMode2;
  options: Options<OptionsMode2>;
}

const PRESETS: NomPresetMode2[] = [
  'massesEgales',
  'grosEtPetit',
  'planeteSoleil',
  'visiteur',
  'orbiteCirculaire',
];

const POINTS_DE_VUE: PointDeVue[] = ['fixe', 'centreDeMasse', 'centreA', 'centreB'];

/** Échelle logarithmique du curseur de masse (F-M2-1) : la glissière porte log₁₀(m). */
const ECHELLE_MASSE = {
  versGlissiere: (m: number) => Math.log10(m),
  // Arrondi à 2 décimales, comme l'affichage (D-25).
  depuisGlissiere: (g: number) => Math.round(10 ** g * 100) / 100,
};
const GLISSIERE_MASSE = { min: Math.log10(MASSE_MIN), max: Math.log10(MASSE_MAX), pas: 0.01 };
const GRADUATIONS_MASSE = [0.01, 0.1, 1, 10];

function Mesure({ titre, valeur, unite }: { titre: string; valeur: string; unite?: string }) {
  return (
    <div className="mesure">
      <span className="mesure__titre">{titre}</span>
      <span className="mesure__valeur">
        {valeur} {unite && <span className="mesure__unite">{unite}</span>}
      </span>
    </div>
  );
}

export function PanneauMode2({ sim, options }: Props) {
  useVersion(sim);
  useVersion(options);
  const [onglet, setOnglet] = useState<NomCorps>('a');
  const reg = sim.reglages;
  const corps = reg[onglet];
  const nom = onglet.toUpperCase();
  const modifier = (c: Partial<CorpsMode2>) =>
    sim.modifierReglages({ ...reg, [onglet]: { ...corps, ...c } });
  const el = sim.elementsRelatifs;
  const cl = sim.classificationRelative;
  const rapport = rapportMasses(reg.a.masse, reg.b.masse);

  return (
    <>
      <section className="section-panneau" aria-labelledby="titre-presets2">
        <h2 id="titre-presets2">{fr.presets2.titre}</h2>
        <div className="pilules">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className="bouton-pilule"
              onClick={() => sim.modifierReglages(presetMode2(p, reg))}
            >
              {fr.presets2[p]}
            </button>
          ))}
        </div>
      </section>

      <section className="section-panneau" aria-labelledby="titre-lancement2">
        <h2 id="titre-lancement2">{fr.lancement.titre}</h2>
        <div className="onglets" role="tablist" aria-label={fr.lancement.titre}>
          {(['a', 'b'] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              id={`onglet-${c}`}
              aria-selected={onglet === c}
              aria-controls="panneau-corps"
              tabIndex={onglet === c ? 0 : -1}
              className={`onglet onglet--${c}`}
              onClick={() => setOnglet(c)}
              onKeyDown={(e) => {
                // Flèches gauche/droite entre les onglets (motif ARIA « tabs »).
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  const suivant = c === 'a' ? 'b' : 'a';
                  setOnglet(suivant);
                  document.getElementById(`onglet-${suivant}`)?.focus();
                }
              }}
            >
              <span className={`pastille-corps pastille-corps--${c}`} aria-hidden="true" />
              {c === 'a' ? fr.lancement2.corpsA : fr.lancement2.corpsB}
            </button>
          ))}
        </div>

        <div id="panneau-corps" role="tabpanel" aria-labelledby={`onglet-${onglet}`}>
          <Curseur
            libelle={fr.lancement2.masse(nom)}
            unite={fr.unites.masse}
            valeur={corps.masse}
            min={MASSE_MIN}
            max={MASSE_MAX}
            pas={0.01}
            decimales={2}
            echelle={ECHELLE_MASSE}
            glissiere={GLISSIERE_MASSE}
            onChange={(masse) => modifier({ masse })}
          >
            <div className="graduations" aria-hidden="true">
              {GRADUATIONS_MASSE.map((m) => (
                <span key={m}>{format(m, m < 1 ? (m < 0.1 ? 2 : 1) : 0)}</span>
              ))}
            </div>
          </Curseur>

          <fieldset className="groupe-champs">
            <legend>
              {fr.lancement2.position} <span className="unite-legende">({fr.unites.distance})</span>
            </legend>
            <ChampNombre
              libelle={fr.lancement2.x}
              valeur={corps.r.x}
              min={-POSITION_MAX_MODE2}
              max={POSITION_MAX_MODE2}
              decimales={2}
              onChange={(x) => modifier({ r: { ...corps.r, x } })}
            />
            <ChampNombre
              libelle={fr.lancement2.y}
              valeur={corps.r.y}
              min={-POSITION_MAX_MODE2}
              max={POSITION_MAX_MODE2}
              decimales={2}
              onChange={(y) => modifier({ r: { ...corps.r, y } })}
            />
          </fieldset>

          <fieldset className="groupe-champs">
            <legend>
              {fr.lancement2.vitesse} <span className="unite-legende">({fr.unites.vitesse})</span>
            </legend>
            <ChampNombre
              libelle={fr.lancement2.vx}
              valeur={corps.v.x}
              min={-VITESSE_MAX_MODE2}
              max={VITESSE_MAX_MODE2}
              decimales={2}
              onChange={(x) => modifier({ v: { ...corps.v, x } })}
            />
            <ChampNombre
              libelle={fr.lancement2.vy}
              valeur={corps.v.y}
              min={-VITESSE_MAX_MODE2}
              max={VITESSE_MAX_MODE2}
              decimales={2}
              onChange={(y) => modifier({ v: { ...corps.v, y } })}
            />
          </fieldset>
        </div>
        <p className="aide">{fr.lancement2.gestes}</p>
      </section>

      <section className="section-panneau" aria-labelledby="titre-point-de-vue">
        <h2 id="titre-point-de-vue">{fr.pointDeVue.titre}</h2>
        <div className="grille-boutons" role="group" aria-labelledby="titre-point-de-vue">
          {POINTS_DE_VUE.map((v) => (
            <button
              key={v}
              type="button"
              className="bouton-carre"
              aria-pressed={options.valeurs.pointDeVue === v}
              onClick={() => options.definir('pointDeVue', v)}
            >
              {fr.pointDeVue[v]}
            </button>
          ))}
        </div>
        <div className="ligne-aide">
          <p className="aide">{fr.pointDeVue.annulerDeriveDetail}</p>
          <button
            type="button"
            role="switch"
            className="interrupteur interrupteur--petit"
            aria-checked={sim.annulerDerive}
            onClick={() => sim.definirAnnulerDerive(!sim.annulerDerive)}
          >
            {fr.pointDeVue.annulerDerive}
            <span className="interrupteur__piste" aria-hidden="true" />
          </button>
        </div>
        <Bulle>{fr.bulles.pointDeVue}</Bulle>
        <Bulle>{fr.bulles.centreDeMasse}</Bulle>
      </section>

      <section className="carte carte-duo" aria-labelledby="titre-duo">
        <h2 id="titre-duo">{fr.duo.titre}</h2>
        <p className="duo-etat" aria-live="polite">
          <span className={`badge ${sim.lies ? 'badge--lies' : 'badge--non-lies'}`}>
            {sim.lies ? fr.duo.lies : fr.duo.nonLies}
          </span>
          <span>{sim.lies ? fr.duo.liesDetail : fr.duo.nonLiesDetail}</span>
        </p>
        <Bulle>{fr.bulles.corpsLies}</Bulle>
        {cl.collision && (
          <p className="avertissement" role="status">
            <span aria-hidden="true">⚠ </span>
            {fr.duo.contact}
          </p>
        )}
        <div className="mesures">
          <Mesure
            titre={fr.duo.rapport}
            valeur={
              rapport.plusLourd === null
                ? 'A = B'
                : rapport.plusLourd === 'A'
                  ? `A = ${formatFacteur(rapport.facteur)} × B`
                  : `B = ${formatFacteur(rapport.facteur)} × A`
            }
          />
          {cl.type === 'conique' && (
            <Mesure titre={fr.duo.excentricite} valeur={formatExcentricite(el.e)} />
          )}
          {sim.lies && el.periode !== null && (
            <Mesure titre={fr.duo.periode} valeur={format(el.periode)} unite={fr.unites.temps} />
          )}
          {cl.type === 'conique' && Number.isFinite(el.a) && (
            <Mesure
              titre={fr.duo.demiGrandAxe}
              valeur={format(Math.abs(el.a))}
              unite={fr.unites.distance}
            />
          )}
        </div>
      </section>
    </>
  );
}
