/** Machine d'états de la simulation (F-APP-4). Pure. */

export type EtatSimulation = 'edition' | 'enCours' | 'pause' | 'terminee';

export type ActionSimulation =
  /** Bouton principal « Lancer » (ou reprise après une pause). */
  | 'lancer'
  | 'pause'
  /** Avancer d'un pas (D-19 : depuis Édition, lance puis met en pause). */
  | 'pas'
  | 'recommencer'
  /** Modification d'un réglage : retour à Édition (t = 0). */
  | 'modifier'
  /** Collision ou sortie détectée. */
  | 'terminer';

export function transition(etat: EtatSimulation, action: ActionSimulation): EtatSimulation {
  switch (action) {
    case 'recommencer':
    case 'modifier':
      return 'edition';
    case 'lancer':
      return etat === 'terminee' ? 'terminee' : 'enCours';
    case 'pause':
      return etat === 'enCours' ? 'pause' : etat;
    case 'pas':
      return etat === 'terminee' ? 'terminee' : 'pause';
    case 'terminer':
      return etat === 'edition' ? 'edition' : 'terminee';
  }
}

/** Action déclenchée par le bouton principal selon l'état. */
export function actionPrincipale(etat: EtatSimulation): 'lancer' | 'pause' | 'recommencer' {
  if (etat === 'enCours') return 'pause';
  if (etat === 'terminee') return 'recommencer';
  return 'lancer';
}
