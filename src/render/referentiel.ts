/**
 * Points de vue du mode 2 (§ 5.6) : la simulation tourne toujours dans le repère fixe ; le point
 * de vue n'est qu'une transformation d'affichage. L'origine affichée est une moyenne pondérée
 * des positions des corps : O = wA·r⃗A + wB·r⃗B.
 */

import type { Point } from './camera';

export type PointDeVue = 'fixe' | 'centreDeMasse' | 'centreA' | 'centreB';

export type NomCorps = 'a' | 'b';

/** Poids (wA, wB) de l'origine affichée. */
export function poidsOrigine(vue: PointDeVue, mA: number, mB: number): readonly [number, number] {
  switch (vue) {
    case 'fixe':
      return [0, 0];
    case 'centreDeMasse':
      return [mA / (mA + mB), mB / (mA + mB)];
    case 'centreA':
      return [1, 0];
    case 'centreB':
      return [0, 1];
  }
}

export function origine(
  poids: readonly [number, number],
  xA: number,
  yA: number,
  xB: number,
  yB: number,
): Point {
  return { x: poids[0] * xA + poids[1] * xB, y: poids[0] * yA + poids[1] * yB };
}

/**
 * Position réelle (repère fixe) à donner au corps `quel` pour qu'il s'affiche en `affiche`, l'autre
 * corps restant en `autre` : affichée = (1 − wᵢ)·r⃗ᵢ − wⱼ·r⃗ⱼ ⇒ r⃗ᵢ = (affichée + wⱼ·r⃗ⱼ)/(1 − wᵢ).
 * `null` si le corps est lui-même l'origine (il ne peut pas être déplacé dans ce point de vue).
 */
export function positionReelle(
  poids: readonly [number, number],
  quel: NomCorps,
  affiche: Point,
  autre: Point,
): Point | null {
  const [wi, wj] = quel === 'a' ? poids : [poids[1], poids[0]];
  if (wi >= 1) return null;
  return { x: (affiche.x + wj * autre.x) / (1 - wi), y: (affiche.y + wj * autre.y) / (1 - wi) };
}
