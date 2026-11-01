import { useEffect, useRef } from 'react';
import {
  FACTEUR_ZOOM_MOLETTE,
  FLECHE_PX_PAR_VITESSE,
  RAYON_PRISE_PX,
  TRACE_SEUIL_PX,
} from '../config';
import { format } from '../format';
import { fr } from '../i18n/fr';
import { appliquerAimant, reglagesDepuisFleche, reglagesDepuisPosition } from '../physics/mode1';
import { versEcran, versMonde } from '../render/camera';
import { dessinerScene1, pointeFleche } from '../render/scene1';
import { type Vue } from '../render/vue';
import { demarrerBoucle } from '../sim/boucle';
import { type Options, type OptionsMode1 } from '../sim/options';
import { type SimulationMode1, formeDe } from '../sim/simulationMode1';
import { useVersion } from './useVersion';

interface Props {
  sim: SimulationMode1;
  vue: Vue;
  options: Options<OptionsMode1>;
}

type Geste =
  | { type: 'vue'; id: number; x: number; y: number }
  | { type: 'astre'; id: number }
  | { type: 'fleche'; id: number };

function description(sim: SimulationMode1): string {
  const forme = formeDe(sim.classification);
  const nom = forme === 'droite' ? fr.formes.droite : fr.formes[forme];
  const { r } = sim.astre;
  return fr.scene.description(nom, format(Math.hypot(r.x, r.y)), format(sim.temps));
}

export function VueSimulation({ sim, vue, options }: Props) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geste = useRef<Geste | null>(null);
  useVersion(sim);

  // Boucle d'animation, redimensionnement et description textuelle (sans re-rendu React).
  useEffect(() => {
    const conteneur = conteneurRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!conteneur || !canvas || !ctx) return;
    let dpr = window.devicePixelRatio || 1;

    const observateur = new ResizeObserver((entrees) => {
      const boite = entrees[0]?.contentRect;
      if (!boite) return;
      dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(boite.width * dpr);
      canvas.height = Math.round(boite.height * dpr);
      vue.redimensionner(boite.width, boite.height);
    });
    observateur.observe(conteneur);

    const arreter = demarrerBoucle((dt) => {
      sim.seuilTrace = TRACE_SEUIL_PX / vue.camera.echelle;
      sim.avancer(dt);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dessinerScene1(ctx, vue.camera, sim, options.valeurs);
    });

    const majDescription = () => canvas.setAttribute('aria-label', description(sim));
    majDescription();
    const id = window.setInterval(majDescription, 1000);

    // Molette : écouteur non passif pour empêcher le défilement de la page.
    const molette = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      vue.zoomer(FACTEUR_ZOOM_MOLETTE ** -e.deltaY, e.clientX - rect.left, e.clientY - rect.top);
    };
    canvas.addEventListener('wheel', molette, { passive: false });

    return () => {
      arreter();
      observateur.disconnect();
      window.clearInterval(id);
      canvas.removeEventListener('wheel', molette);
    };
  }, [sim, vue, options]);

  /** Élément saisissable sous le pointeur : pointe de la flèche, puis point de départ (F-M1-2). */
  const cible = (sx: number, sy: number): 'astre' | 'fleche' | null => {
    const depart = versEcran(vue.camera, sim.depart.r.x, sim.depart.r.y);
    const pointe = pointeFleche(depart, sim.depart.v);
    if (pointe && Math.hypot(sx - pointe.x, sy - pointe.y) <= RAYON_PRISE_PX) return 'fleche';
    if (Math.hypot(sx - depart.x, sy - depart.y) <= RAYON_PRISE_PX) return 'astre';
    return null;
  };

  const position = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const fin = sim.fin ? fr.fins[sim.fin] : '';

  return (
    <div className="vue-simulation" ref={conteneurRef}>
      <canvas
        ref={canvasRef}
        role="img"
        className="vue-simulation__canvas"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = position(e);
          const quoi = cible(p.x, p.y);
          if (quoi) {
            vue.geler();
            geste.current = { type: quoi, id: e.pointerId };
          } else {
            geste.current = { type: 'vue', id: e.pointerId, x: e.clientX, y: e.clientY };
          }
        }}
        onPointerMove={(e) => {
          const g = geste.current;
          const p = position(e);
          if (!g) {
            // Survol : indique ce qui est saisissable.
            e.currentTarget.style.cursor = cible(p.x, p.y) ? 'pointer' : '';
            return;
          }
          if (g.id !== e.pointerId) return;
          if (g.type === 'vue') {
            vue.deplacer(e.clientX - g.x, e.clientY - g.y);
            geste.current = { ...g, x: e.clientX, y: e.clientY };
          } else if (g.type === 'astre') {
            const m = versMonde(vue.camera, p.x, p.y);
            sim.modifierReglages(reglagesDepuisPosition(sim.reglages, m.x, m.y));
          } else {
            const depart = versEcran(vue.camera, sim.depart.r.x, sim.depart.r.y);
            const reg = reglagesDepuisFleche(
              sim.reglages,
              (p.x - depart.x) / FLECHE_PX_PAR_VITESSE,
              -(p.y - depart.y) / FLECHE_PX_PAR_VITESSE,
            );
            sim.modifierReglages(options.valeurs.aimant ? appliquerAimant(reg) : reg);
          }
        }}
        onPointerUp={() => {
          if (geste.current?.type !== 'vue') vue.degeler();
          geste.current = null;
        }}
        onPointerCancel={() => {
          if (geste.current?.type !== 'vue') vue.degeler();
          geste.current = null;
        }}
      />
      <p className="vue-simulation__fin" aria-live="polite">
        {fin}
      </p>
    </div>
  );
}
