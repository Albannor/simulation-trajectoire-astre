import { type ReactNode, useEffect, useRef } from 'react';
import { FACTEUR_ZOOM_MOLETTE, TRACE_SEUIL_PX } from '../config';
import { fr } from '../i18n/fr';
import { type Vue } from '../render/vue';
import { demarrerBoucle } from '../sim/boucle';
import { type SimulationBase } from '../sim/simulationBase';
import { type Interaction } from './interaction';
import { useVersion } from './useVersion';

type CleFin = keyof typeof fr.fins;

interface Props {
  sim: SimulationBase<unknown, CleFin>;
  vue: Vue;
  interaction: Interaction;
  /** Éléments superposés à la scène (bulles d'explication). */
  children?: ReactNode;
}

/** Zone de dessin : boucle d'animation, gestes (glisser un élément ou la vue), molette. */
export function VueSimulation({ sim, vue, interaction, children }: Props) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geste = useRef<
    | { type: 'vue'; id: number; x: number; y: number }
    | { type: 'element'; id: number; cible: string }
    | null
  >(null);
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
      interaction.dessiner(ctx, vue.camera);
    });

    const majDescription = () => canvas.setAttribute('aria-label', interaction.description());
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
  }, [sim, vue, interaction]);

  const position = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const terminer = () => {
    if (geste.current?.type === 'element') vue.degeler();
    geste.current = null;
  };

  return (
    <div className="vue-simulation" ref={conteneurRef}>
      <canvas
        ref={canvasRef}
        role="img"
        className="vue-simulation__canvas"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = position(e);
          const cible = interaction.cible(p.x, p.y);
          if (cible) {
            // Cadrage automatique suspendu : la scène ne bouge pas sous le doigt.
            vue.geler();
            geste.current = { type: 'element', id: e.pointerId, cible };
          } else {
            geste.current = { type: 'vue', id: e.pointerId, x: e.clientX, y: e.clientY };
          }
        }}
        onPointerMove={(e) => {
          const g = geste.current;
          const p = position(e);
          if (!g) {
            // Survol : indique ce qui est saisissable.
            e.currentTarget.style.cursor = interaction.cible(p.x, p.y) ? 'pointer' : '';
            return;
          }
          if (g.id !== e.pointerId) return;
          if (g.type === 'vue') {
            vue.deplacer(e.clientX - g.x, e.clientY - g.y);
            geste.current = { ...g, x: e.clientX, y: e.clientY };
          } else {
            interaction.glisser(g.cible, p.x, p.y);
          }
        }}
        onPointerUp={terminer}
        onPointerCancel={terminer}
      />
      <p className="vue-simulation__fin" aria-live="polite">
        {sim.fin ? fr.fins[sim.fin] : ''}
      </p>
      {children}
    </div>
  );
}
