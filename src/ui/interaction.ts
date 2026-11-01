import { type Camera } from '../render/camera';

/** Ce qu'un mode fournit à la vue de simulation : dessin, gestes directs et description. */
export interface Interaction {
  dessiner: (ctx: CanvasRenderingContext2D, cam: Camera) => void;
  /** Élément saisissable sous le point écran (px), ou null (le fond déplace alors la vue). */
  cible: (sx: number, sy: number) => string | null;
  /** Déplacement d'un élément saisi vers le point écran (px). */
  glisser: (cible: string, sx: number, sy: number) => void;
  /** Description textuelle du dessin (role="img"). */
  description: () => string;
}
