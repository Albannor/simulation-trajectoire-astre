import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { theme } from '../render/theme';

/*
 * Contraste du texte ≥ 4,5:1 (§ 7.3, CLAUDE.md règle 9). Les couleurs sont lues dans theme.css
 * (source de vérité de l'interface) ; chaque couple ci-dessous correspond à un texte réellement
 * affiché sur ce fond. Formule de luminance relative et de contraste : WCAG 2.1.
 */

const css = readFileSync(new URL('./theme.css', import.meta.url), 'utf8');

function jeton(nom: string): string {
  const m = css.match(new RegExp(`--${nom}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m?.[1]) throw new Error(`jeton --${nom} introuvable`);
  return m[1];
}

function luminance(hex: string): number {
  const canal = (i: number) => {
    const c = parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(0) + 0.7152 * canal(1) + 0.0722 * canal(2);
}

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

/** [texte, fond, usage] — noms de jetons CSS. */
const COUPLES: [string, string, string][] = [
  ['texte', 'fond-app', 'barre « Afficher », commandes'],
  ['texte', 'fond-simulation', 'étiquettes du canvas'],
  ['texte', 'fond-entete', 'en-tête, tuiles'],
  ['texte', 'fond-panneau', 'panneau'],
  ['texte', 'fond-carte', 'cartes, mesures, avertissement'],
  ['texte', 'fond-bulle', 'bulles, bascules actives, onglets'],
  ['texte-secondaire', 'fond-app', 'bascules inactives, libellés'],
  ['texte-secondaire', 'fond-simulation', 'étiquettes « départ » du canvas'],
  ['texte-secondaire', 'fond-entete', 'titres des tuiles'],
  ['texte-secondaire', 'fond-panneau', 'aides, graduations, libellés de champs'],
  ['texte-secondaire', 'fond-carte', 'légendes de la jauge, titres des mesures'],
  ['accent', 'fond-panneau', 'valeurs des curseurs'],
  ['accent', 'fond-simulation', 'étiquette « Soleil »'],
  ['texte-sur-accent', 'accent', 'boutons principaux, segments actifs'],
  ['couleur-cercle', 'fond-carte', 'nom de la forme'],
  ['couleur-ellipse', 'fond-carte', 'nom de la forme'],
  ['couleur-parabole', 'fond-carte', 'nom de la forme'],
  ['couleur-hyperbole', 'fond-carte', 'nom de la forme'],
  ['couleur-cercle', 'fond-simulation', 'étiquette « astre »'],
  ['couleur-ellipse', 'fond-simulation', 'étiquette « astre »'],
  ['couleur-parabole', 'fond-simulation', 'étiquette « astre »'],
  ['couleur-hyperbole', 'fond-simulation', 'étiquette « astre »'],
  ['couleur-corps-a', 'fond-simulation', 'étiquette « A »'],
  ['couleur-corps-b', 'fond-simulation', 'étiquette « B »'],
  ['couleur-cercle', 'fond-panneau', 'repère « circulaire »'],
  ['couleur-hyperbole', 'fond-panneau', 'repère « libération »'],
  ['couleur-cercle', 'fond-app', 'pastille « précision correcte »'],
  ['couleur-hyperbole', 'fond-app', 'pastilles d’alerte, annonce de fin'],
  ['couleur-hyperbole', 'fond-simulation', 'annonce de fin sur la scène'],
  ['texte-sur-accent', 'couleur-ellipse', 'badge « Corps liés »'],
  ['texte-sur-accent', 'couleur-hyperbole', 'badge « Corps non liés »'],
];

describe('contraste du texte ≥ 4,5:1 (§ 7.3)', () => {
  it.each(COUPLES)('%s sur %s (%s)', (texte, fond) => {
    expect(contraste(jeton(texte), jeton(fond))).toBeGreaterThanOrEqual(4.5);
  });

  it('le thème du canvas reprend les couleurs du CSS', () => {
    expect(theme.fondSimulation.toLowerCase()).toBe(jeton('fond-simulation'));
    expect(theme.texte.toLowerCase()).toBe(jeton('texte'));
    expect(theme.texteSecondaire.toLowerCase()).toBe(jeton('texte-secondaire'));
    expect(theme.accent.toLowerCase()).toBe(jeton('accent'));
    expect(theme.formes.ellipse.toLowerCase()).toBe(jeton('couleur-ellipse'));
    expect(theme.formes.hyperbole.toLowerCase()).toBe(jeton('couleur-hyperbole'));
    expect(theme.formes.cercle.toLowerCase()).toBe(jeton('couleur-cercle'));
    expect(theme.formes.parabole.toLowerCase()).toBe(jeton('couleur-parabole'));
    expect(theme.corpsA.toLowerCase()).toBe(jeton('couleur-corps-a'));
    expect(theme.corpsB.toLowerCase()).toBe(jeton('couleur-corps-b'));
  });
});
