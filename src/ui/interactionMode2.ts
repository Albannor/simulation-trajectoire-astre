import {
  FLECHE_PX_PAR_VITESSE,
  POSITION_MAX_MODE2,
  RAYON_PRISE_PX,
  VITESSE_MAX_MODE2,
} from '../config';
import { format } from '../format';
import { fr } from '../i18n/fr';
import { type Vec2, sub } from '../physics/vec2';
import { versEcran, versMonde } from '../render/camera';
import { pointeFleche } from '../render/primitives';
import { type NomCorps, poidsOrigine, positionReelle } from '../render/referentiel';
import { departsAffiches, dessinerScene2 } from '../render/scene2';
import { type Vue } from '../render/vue';
import { type Options, type OptionsMode2 } from '../sim/options';
import { type SimulationMode2 } from '../sim/simulationMode2';
import { type Interaction } from './interaction';

function borner(v: Vec2, max: number): Vec2 {
  const n = Math.hypot(v.x, v.y);
  return n > max ? { x: (v.x * max) / n, y: (v.y * max) / n } : v;
}

function bornerPosition(p: Vec2): Vec2 {
  const b = (x: number) => Math.min(POSITION_MAX_MODE2, Math.max(-POSITION_MAX_MODE2, x));
  return { x: b(p.x), y: b(p.y) };
}

/**
 * Dessin et gestes directs du mode 2 (F-M2-1) : glisser chaque corps (dans n'importe quel point
 * de vue, sauf le corps servant d'origine) et tirer sa flèche de vitesse (en Édition).
 */
export function interactionMode2(
  sim: SimulationMode2,
  vue: Vue,
  options: Options<OptionsMode2>,
): Interaction {
  const ecranDepart = (quel: NomCorps) => {
    const d = departsAffiches(sim, options.valeurs.pointDeVue)[quel];
    return versEcran(vue.camera, d.x, d.y);
  };
  const deplacable = (quel: NomCorps) =>
    !(
      (quel === 'a' && options.valeurs.pointDeVue === 'centreA') ||
      (quel === 'b' && options.valeurs.pointDeVue === 'centreB')
    );

  return {
    dessiner: (ctx, cam) => dessinerScene2(ctx, cam, sim, options.valeurs),

    cible: (sx, sy) => {
      if (sim.etat === 'edition') {
        for (const quel of ['a', 'b'] as const) {
          const pointe = pointeFleche(ecranDepart(quel), sim.reglages[quel].v);
          if (pointe && Math.hypot(sx - pointe.x, sy - pointe.y) <= RAYON_PRISE_PX) {
            return `fleche-${quel}`;
          }
        }
      }
      for (const quel of ['a', 'b'] as const) {
        const p = ecranDepart(quel);
        if (deplacable(quel) && Math.hypot(sx - p.x, sy - p.y) <= RAYON_PRISE_PX) {
          return `corps-${quel}`;
        }
      }
      return null;
    },

    glisser: (cible, sx, sy) => {
      const [type, nom] = cible.split('-');
      const quel: NomCorps = nom === 'b' ? 'b' : 'a';
      const autre: NomCorps = quel === 'a' ? 'b' : 'a';
      const reg = sim.reglages;
      if (type === 'corps') {
        const poids = poidsOrigine(options.valeurs.pointDeVue, reg.a.masse, reg.b.masse);
        const r = positionReelle(poids, quel, versMonde(vue.camera, sx, sy), reg[autre].r);
        if (!r) return;
        sim.modifierReglages({ ...reg, [quel]: { ...reg[quel], r: bornerPosition(r) } });
      } else {
        const p = ecranDepart(quel);
        const v = borner(
          { x: (sx - p.x) / FLECHE_PX_PAR_VITESSE, y: -(sy - p.y) / FLECHE_PX_PAR_VITESSE },
          VITESSE_MAX_MODE2,
        );
        sim.modifierReglages({ ...reg, [quel]: { ...reg[quel], v } });
      }
    },

    description: () => {
      const { a, b } = sim.corps;
      const d = sub(b.r, a.r);
      return fr.scene2.description(
        sim.lies ? fr.duo.lies : fr.duo.nonLies,
        format(Math.hypot(d.x, d.y)),
        format(sim.temps),
      );
    },
  };
}
