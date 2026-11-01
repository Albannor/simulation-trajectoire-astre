import { describe, expect, it } from 'vitest';
import { type ActionSimulation, type EtatSimulation, actionPrincipale, transition } from './etats';

describe('machine d’états (F-APP-4)', () => {
  const cas: [EtatSimulation, ActionSimulation, EtatSimulation][] = [
    ['edition', 'lancer', 'enCours'],
    ['enCours', 'pause', 'pause'],
    ['pause', 'lancer', 'enCours'],
    ['enCours', 'terminer', 'terminee'],
    ['pause', 'terminer', 'terminee'],
    ['terminee', 'recommencer', 'edition'],
    ['enCours', 'modifier', 'edition'],
    ['pause', 'modifier', 'edition'],
    ['terminee', 'modifier', 'edition'],
    ['edition', 'pas', 'pause'],
    ['enCours', 'pas', 'pause'],
    ['terminee', 'pas', 'terminee'],
    ['terminee', 'lancer', 'terminee'],
    ['edition', 'pause', 'edition'],
    ['edition', 'terminer', 'edition'],
  ];
  it.each(cas)('%s + %s → %s', (etat, action, attendu) => {
    expect(transition(etat, action)).toBe(attendu);
  });

  it('bouton principal', () => {
    expect(actionPrincipale('edition')).toBe('lancer');
    expect(actionPrincipale('enCours')).toBe('pause');
    expect(actionPrincipale('pause')).toBe('lancer');
    expect(actionPrincipale('terminee')).toBe('recommencer');
  });
});
