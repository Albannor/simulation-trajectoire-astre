/**
 * Boucle d'animation requestAnimationFrame. `image` reçoit le temps réel écoulé depuis l'image
 * précédente (s) ; aucun re-rendu React n'est déclenché ici (§ 8.3).
 */
export function demarrerBoucle(image: (dtReel: number) => void): () => void {
  let id = 0;
  let precedent: number | null = null;
  const pas = (instant: number) => {
    const dt = precedent === null ? 0 : (instant - precedent) / 1000;
    precedent = instant;
    image(dt);
    id = requestAnimationFrame(pas);
  };
  id = requestAnimationFrame(pas);
  return () => cancelAnimationFrame(id);
}
