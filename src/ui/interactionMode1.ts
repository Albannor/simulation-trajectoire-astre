import { FLECHE_PX_PAR_VITESSE, RAYON_PRISE_PX } from '../config';
import { format } from '../format';
import { fr } from '../i18n/fr';
import { appliquerAimant, reglagesDepuisFleche, reglagesDepuisPosition } from '../physics/mode1';
import { versEcran, versMonde } from '../render/camera';
import { pointeFleche } from '../render/primitives';
import { dessinerScene1 } from '../render/scene1';
import { type Vue } from '../render/vue';
import { type Options, type OptionsMode1 } from '../sim/options';
import { type SimulationMode1, formeDe } from '../sim/simulationMode1';
import { type Interaction } from './interaction';

/** Dessin et gestes directs du mode 1 (F-M1-2) : glisser l'astre, tirer la flèche. */
export function interactionMode1(
  sim: SimulationMode1,
  vue: Vue,
  options: Options<OptionsMode1>,
): Interaction {
  return {
    dessiner: (ctx, cam) => dessinerScene1(ctx, cam, sim, options.valeurs),

    cible: (sx, sy) => {
      const depart = versEcran(vue.camera, sim.depart.r.x, sim.depart.r.y);
      const pointe = pointeFleche(depart, sim.depart.v);
      if (pointe && Math.hypot(sx - pointe.x, sy - pointe.y) <= RAYON_PRISE_PX) return 'fleche';
      if (Math.hypot(sx - depart.x, sy - depart.y) <= RAYON_PRISE_PX) return 'astre';
      return null;
    },

    glisser: (cible, sx, sy) => {
      if (cible === 'astre') {
        const m = versMonde(vue.camera, sx, sy);
        sim.modifierReglages(reglagesDepuisPosition(sim.reglages, m.x, m.y));
        return;
      }
      const depart = versEcran(vue.camera, sim.depart.r.x, sim.depart.r.y);
      const reg = reglagesDepuisFleche(
        sim.reglages,
        (sx - depart.x) / FLECHE_PX_PAR_VITESSE,
        -(sy - depart.y) / FLECHE_PX_PAR_VITESSE,
      );
      sim.modifierReglages(options.valeurs.aimant ? appliquerAimant(reg) : reg);
    },

    description: () => {
      const forme = formeDe(sim.classification);
      const nom = forme === 'droite' ? fr.formes.droite : fr.formes[forme];
      const { r } = sim.astre;
      return fr.scene.description(nom, format(Math.hypot(r.x, r.y)), format(sim.temps));
    },
  };
}
