import { useEffect, useRef } from 'react';
import { FACTEUR_ZOOM_MOLETTE, TRACE_SEUIL_PX } from '../config';
import { format } from '../format';
import { fr } from '../i18n/fr';
import { dessinerScene1 } from '../render/scene1';
import { type Vue } from '../render/vue';
import { demarrerBoucle } from '../sim/boucle';
import { type SimulationMode1, formeDe } from '../sim/simulationMode1';
import { useVersion } from './useVersion';

interface Props {
  sim: SimulationMode1;
  vue: Vue;
}

function description(sim: SimulationMode1): string {
  const forme = formeDe(sim.classification);
  const nom = forme === 'droite' ? fr.formes.droite : fr.formes[forme];
  const { r } = sim.astre;
  return fr.scene.description(nom, format(Math.hypot(r.x, r.y)), format(sim.temps));
}

export function VueSimulation({ sim, vue }: Props) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glisser = useRef<{ id: number; x: number; y: number } | null>(null);
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
      dessinerScene1(ctx, vue.camera, sim);
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
  }, [sim, vue]);

  const fin = sim.fin ? fr.fins[sim.fin] : '';

  return (
    <div className="vue-simulation" ref={conteneurRef}>
      <canvas
        ref={canvasRef}
        role="img"
        className="vue-simulation__canvas"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          glisser.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          const g = glisser.current;
          if (!g || g.id !== e.pointerId) return;
          vue.deplacer(e.clientX - g.x, e.clientY - g.y);
          glisser.current = { id: g.id, x: e.clientX, y: e.clientY };
        }}
        onPointerUp={() => (glisser.current = null)}
        onPointerCancel={() => (glisser.current = null)}
      />
      <p className="vue-simulation__fin" aria-live="polite">
        {fin}
      </p>
    </div>
  );
}
