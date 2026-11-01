/**
 * État de la vue (caméra, cadrage automatique), hors de React.
 * Cadrage automatique tant que l'utilisateur n'a ni zoomé ni déplacé la vue ; « Recentrer »
 * le réactive (F-SIM-4).
 */

import { FACTEUR_ZOOM_BOUTON, MARGE_CADRAGE_PX } from '../config';
import { type Boite, type Camera, cadrer, deplacer, redimensionner, zoomerAutour } from './camera';

export class Vue {
  camera: Camera = { cx: 0, cy: 0, echelle: 100, largeur: 1, hauteur: 1 };
  /** Vrai dès que l'utilisateur a zoomé ou déplacé la vue. */
  manuel = false;
  private boite: Boite | null = null;

  /** Boîte de la scène à cadrer (recalculée à chaque changement de réglage). */
  definirBoite(boite: Boite): void {
    this.boite = boite;
    if (!this.manuel) this.cadrerAuto();
  }

  redimensionner(largeur: number, hauteur: number): void {
    this.camera = redimensionner(this.camera, largeur, hauteur);
    if (!this.manuel) this.cadrerAuto();
  }

  recentrer(): void {
    this.manuel = false;
    this.cadrerAuto();
  }

  /** Zoom de facteur `facteur` autour d'un point écran (par défaut le centre). */
  zoomer(facteur: number, sx?: number, sy?: number): void {
    this.manuel = true;
    this.camera = zoomerAutour(
      this.camera,
      facteur,
      sx ?? this.camera.largeur / 2,
      sy ?? this.camera.hauteur / 2,
    );
  }

  zoomPlus(): void {
    this.zoomer(FACTEUR_ZOOM_BOUTON);
  }

  zoomMoins(): void {
    this.zoomer(1 / FACTEUR_ZOOM_BOUTON);
  }

  deplacer(dx: number, dy: number): void {
    this.manuel = true;
    this.camera = deplacer(this.camera, dx, dy);
  }

  private cadrerAuto(): void {
    if (!this.boite || this.camera.largeur <= 1) return;
    this.camera = cadrer(this.boite, this.camera.largeur, this.camera.hauteur, MARGE_CADRAGE_PX);
  }
}
