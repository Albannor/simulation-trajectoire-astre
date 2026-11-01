import { describe, expect, it } from 'vitest';
import { ETA, MAX_SOUS_PAS, R_COLLISION, R_SORTIE } from '../config';
import { MU_SOLEIL, degToRad } from './constants';
import { avancerImage, choisirPas, pasSauteMouton } from './integrator';
import { anomalieVraie, elements, rayonConique } from './kepler';
import {
  type ReglagesMode1,
  avancerMode1,
  creerSystemeMode1,
  ecartEnergie,
  energieSpecifique,
  etatAstre,
  etatInitialMode1,
  finMode1,
  mesuresMode1,
} from './mode1';
import { barycentre, copierSysteme, creerSysteme, distanceCorps, energieTotale } from './nbody';
import { presetMode1 } from './presets';
import { dureeImage, simulerMode1 } from './test-utils';
import { cross, dot, norm } from './vec2';

/*
 * Toutes les simulations reproduisent le découpage de l'animation : images de TEMPS_X1·k/60 an,
 * pas adaptatif choisi en début d'image (ETA = 0,002). Chaque test est mené à ×1 et à ×100.
 * Les maxima sont relevés après **chaque sous-pas** (et non en fin d'image, ce qui manquait le
 * pic d'erreur au périhélie : Halley ×100, 3,1e-5 relevé par image contre 5,7e-5 au sous-pas).
 * Les tolérances « à calibrer » (§ 9.1) ont été mesurées le 2026-11-01 ; la valeur mesurée
 * figure en commentaire ; la tolérance retenue laisse une marge de ×5 à ×36 sur le pire cas
 * mesuré, sans jamais dépasser la valeur de la spécification.
 *
 * Note : à ×1, les images (1/600 an) sont plus courtes que le pas exigé par ETA loin du Soleil ;
 * la simulation y est donc plus précise qu'à ×100, qui reflète la précision propre à ETA.
 */

const TERRE: ReglagesMode1 = { r0: 1, v0: 2 * Math.PI, theta: Math.PI / 2, sens: 1, phi0: 0 };
const ELLIPSE: ReglagesMode1 = { r0: 0.81, v0: 8.43, theta: degToRad(64), sens: 1, phi0: 0 };
const MULTIPLICATEURS = [1, 100] as const;

describe('T-02 un tour de la Terre', () => {
  it.each(MULTIPLICATEURS)('×%d : retour au départ < 1e-4 UA, dérive d’énergie < 1e-10', (k) => {
    const depart = etatInitialMode1(TERRE);
    const e0 = energieSpecifique(depart);
    let derive = 0;
    const { systeme } = simulerMode1(depart, e0, 1, k, {
      sousPas: (etat) => {
        derive = Math.max(derive, Math.abs((energieSpecifique(etat) - e0) / e0));
      },
    });
    expect(systeme.t).toBeCloseTo(1, 10);
    const fin = etatAstre(systeme);
    // Mesuré : 6,4e-6 UA (×1) ; 8,4e-6 UA (×100). Spécification : < 1e-4.
    expect(norm({ x: fin.r.x - depart.r.x, y: fin.r.y - depart.r.y })).toBeLessThan(1e-4);
    // Mesuré : 2,3e-12 (×1) ; 4,0e-12 (×100). Spécification : < 1e-6 → tolérance resserrée à 1e-10.
    expect(derive).toBeLessThan(1e-10);
  });
});

describe('T-07 conservation sur 10 orbites (e = 0,6)', () => {
  it.each(MULTIPLICATEURS)('×%d : |ΔE/E| < 5e-5, |Δh/h| < 1e-12', (k) => {
    const depart = etatInitialMode1(ELLIPSE);
    const el = elements(depart);
    let dE = 0;
    let dh = 0;
    simulerMode1(depart, el.energie, 10 * el.periode!, k, {
      sousPas: (etat) => {
        dE = Math.max(dE, Math.abs((energieSpecifique(etat) - el.energie) / el.energie));
        dh = Math.max(dh, Math.abs((cross(etat.r, etat.v) - el.h) / el.h));
      },
    });
    // Mesuré : 2,1e-6 (×1) ; 7,0e-6 (×100). Spécification : < 1e-4 → tolérance 5e-5.
    expect(dE).toBeLessThan(5e-5);
    // Le saute-mouton conserve h exactement (force centrale) aux arrondis près.
    // Mesuré : 2,2e-14 (×1) ; 2,9e-14 (×100). Spécification : < 1e-6 → tolérance 1e-12.
    expect(dh).toBeLessThan(1e-12);
  });
});

describe('T-08 Halley sur une orbite', () => {
  const depart = etatInitialMode1(presetMode1('halley', TERRE));
  const el = elements(depart);

  it.each(MULTIPLICATEURS)('×%d : |ΔE/E| < 3e-4', (k) => {
    let dE = 0;
    simulerMode1(depart, el.energie, el.periode!, k, {
      sousPas: (etat) => {
        dE = Math.max(dE, Math.abs((energieSpecifique(etat) - el.energie) / el.energie));
      },
    });
    // Mesuré : 4,2e-5 (×1) ; 5,7e-5 (×100). Spécification : < 1e-3 → tolérance 3e-4.
    expect(dE).toBeLessThan(3e-4);
  });

  it.each(MULTIPLICATEURS)('×%d : période simulée = a^(3/2) à 3e-4 près', (k) => {
    // Retour au périhélie : r⃗·v⃗ passe de négatif à positif entre deux sous-pas ; interpolation
    // linéaire sur ce seul sous-pas (≤ 1,5e-4 an), quelle que soit la durée de l'image.
    let precedent = dot(depart.r, depart.v);
    let tPrecedent = 0;
    let periode: number | null = null;
    simulerMode1(depart, el.energie, 1.1 * el.periode!, k, {
      sousPas: (etat, s) => {
        const rv = dot(etat.r, etat.v);
        if (periode === null && s.t > el.periode! / 2 && precedent < 0 && rv >= 0) {
          periode = tPrecedent + ((s.t - tPrecedent) * -precedent) / (rv - precedent);
        }
        precedent = rv;
        tPrecedent = s.t;
      },
    });
    expect(periode).not.toBeNull();
    // Mesuré : 1,3e-6 (×1) ; 4,1e-5 (×100, précision propre à ETA — voir la note en tête).
    // Spécification : 0,5 % → tolérance 3e-4 (l'ancienne valeur 1e-5 ne valait que pour ×1).
    expect(Math.abs(periode! - el.a ** 1.5) / el.a ** 1.5).toBeLessThan(3e-4);
  });
});

describe('T-09 cohérence prévision / simulation (ellipse e = 0,6, 1 tour)', () => {
  it.each(MULTIPLICATEURS)('×%d : écart à la conique < 1e-3 UA', (k) => {
    const depart = etatInitialMode1(ELLIPSE);
    const el = elements(depart);
    let ecart = 0;
    let n = 0;
    simulerMode1(depart, el.energie, el.periode!, k, {
      sousPas: (etat) => {
        // Écart radial à la conique analytique au même angle polaire (majore la distance à la courbe).
        const nu = anomalieVraie(el, etat.r);
        ecart = Math.max(ecart, Math.abs(norm(etat.r) - rayonConique(el.p, el.e, nu)));
        n++;
      },
    });
    expect(n).toBeGreaterThan(10);
    // Mesuré : 2,7e-6 (×1) ; 1,9e-6 (×100). Spécification : < 1e-3 (non « à calibrer », conservée).
    expect(ecart).toBeLessThan(1e-3);
  });
});

describe('T-14 fins de simulation', () => {
  it.each(MULTIPLICATEURS)('×%d : collision détectée quand rp < R_COLLISION', (k) => {
    const depart = etatInitialMode1({ ...TERRE, v0: 0.5 });
    expect(elements(depart).rp).toBeLessThan(R_COLLISION);
    const { evenement, systeme } = simulerMode1(depart, energieSpecifique(depart), 1, k);
    expect(evenement).toBe('collision');
    // Arrêt au sous-pas (D-15) : l'astre est juste sous R_COLLISION, pas au-delà du Soleil.
    const r = norm(etatAstre(systeme).r);
    expect(r).toBeLessThan(R_COLLISION);
    expect(r).toBeGreaterThan(R_COLLISION / 2);
  });

  it.each(MULTIPLICATEURS)('×%d : chute radiale depuis le repos → collision', (k) => {
    const depart = etatInitialMode1({ ...TERRE, v0: 0 });
    const { evenement } = simulerMode1(depart, energieSpecifique(depart), 1, k);
    expect(evenement).toBe('collision');
  });

  it('×100 : sortie à R_SORTIE pour une hyperbole', () => {
    const depart = etatInitialMode1(presetMode1('cometeHyperbolique', TERRE));
    const { evenement, systeme } = simulerMode1(depart, energieSpecifique(depart), 100, 100);
    expect(evenement).toBe('sortie');
    expect(norm(etatAstre(systeme).r)).toBeGreaterThan(R_SORTIE);
  });

  it('pas de sortie pour une orbite liée au-delà de R_SORTIE', () => {
    const loin = { r: { x: R_SORTIE + 1, y: 0 }, v: { x: 0, y: 0.1 } };
    expect(energieSpecifique(loin)).toBeLessThan(0);
    expect(finMode1(loin, energieSpecifique(loin))).toBeNull();
    expect(finMode1(loin, 0)).toBe('sortie');
  });

  it('pas de fin pour une orbite normale', () => {
    expect(finMode1(etatInitialMode1(TERRE), -1)).toBeNull();
  });
});

describe('pas adaptatif (§ 5.7)', () => {
  it('dt_max = η·√(d³/GM) ; sous-pas = ⌈Δt/dt_max⌉', () => {
    const c = choisirPas(dureeImage(1), 1, MU_SOLEIL);
    const dtMax = ETA * Math.sqrt(1 / MU_SOLEIL);
    expect(c.sousPas).toBe(Math.ceil(dureeImage(1) / dtMax));
    expect(c.dt * c.sousPas).toBeCloseTo(dureeImage(1), 15);
    expect(c.dt).toBeLessThanOrEqual(dtMax);
    expect(c.ralenti).toBe(false);
  });

  it('plafond MAX_SOUS_PAS : simulation ralentie, pas conservé', () => {
    const c = choisirPas(dureeImage(100), R_COLLISION, MU_SOLEIL);
    const dtMax = ETA * Math.sqrt(R_COLLISION ** 3 / MU_SOLEIL);
    expect(c.ralenti).toBe(true);
    expect(c.sousPas).toBe(MAX_SOUS_PAS);
    expect(c.dt).toBeCloseTo(dtMax, 15);
    expect(c.dureeEffective).toBeLessThan(dureeImage(100));
  });

  it('au moins un sous-pas', () => {
    expect(choisirPas(0, 1, MU_SOLEIL).sousPas).toBe(1);
  });

  it('Halley à ×100 au plus près : sous le plafond (D-13)', () => {
    const depart = etatInitialMode1(presetMode1('halley', TERRE));
    const { sousPasMax } = simulerMode1(depart, energieSpecifique(depart), 80, 100);
    expect(sousPasMax).toBeLessThan(MAX_SOUS_PAS);
  });

  it('le système d’entrée n’est pas modifié', () => {
    const s = creerSystemeMode1(etatInitialMode1(TERRE));
    const avant = copierSysteme(s);
    const res = avancerMode1(s, dureeImage(1), -1);
    expect(s).toEqual(avant);
    expect(res.systeme.t).toBeCloseTo(dureeImage(1), 15);
  });

  it('sans fonction d’arrêt, l’image complète est simulée', () => {
    const s = creerSystemeMode1(etatInitialMode1(TERRE));
    const res = avancerImage(s, 0.01, 1, MU_SOLEIL);
    expect(res.evenement).toBeNull();
    expect(res.dureeEffective).toBeCloseTo(0.01, 15);
  });
});

describe('réversibilité du saute-mouton', () => {
  it('aller puis retour (dt → −dt) ramène à l’état initial', () => {
    const s = creerSystemeMode1(etatInitialMode1(ELLIPSE));
    const depart = etatAstre(s);
    const dt = 1e-4;
    for (let i = 0; i < 5000; i++) pasSauteMouton(s, dt);
    for (let i = 0; i < 5000; i++) pasSauteMouton(s, -dt);
    const fin = etatAstre(s);
    expect(norm({ x: fin.r.x - depart.r.x, y: fin.r.y - depart.r.y })).toBeLessThan(1e-10);
    expect(norm({ x: fin.v.x - depart.v.x, y: fin.v.y - depart.v.y })).toBeLessThan(1e-9);
  });
});

describe('système N corps', () => {
  const deux = creerSysteme([
    { masse: 2, r: { x: 0, y: -0.8 }, v: { x: 2.3, y: -1.2 } },
    { masse: 1, r: { x: 0, y: 1.6 }, v: { x: -4.6, y: 2.4 } },
  ]);
  it('barycentre et vitesse du centre de masse', () => {
    const b = barycentre(deux);
    expect(b.masse).toBe(3);
    expect(b.r.y).toBeCloseTo(0, 12);
    expect(b.v.x).toBeCloseTo(0, 12);
    expect(b.v.y).toBeCloseTo(0, 12);
  });
  it('accélérations opposées pondérées par les masses (3ᵉ loi de Newton)', () => {
    expect(2 * deux.acc[0]! + 1 * deux.acc[2]!).toBeCloseTo(0, 10);
    expect(2 * deux.acc[1]! + 1 * deux.acc[3]!).toBeCloseTo(0, 10);
    expect(distanceCorps(deux, 0, 1)).toBeCloseTo(2.4, 12);
  });
  it('énergie totale = cinétique − G·m₁·m₂/d', () => {
    const cin = 0.5 * 2 * (2.3 ** 2 + 1.2 ** 2) + 0.5 * (4.6 ** 2 + 2.4 ** 2);
    expect(energieTotale(deux)).toBeCloseTo(cin - (MU_SOLEIL * 2) / 2.4, 10);
  });
  it('mode 1 : le Soleil reste fixe', () => {
    const s = avancerMode1(creerSystemeMode1(etatInitialMode1(ELLIPSE)), 0.5, -1).systeme;
    expect([s.pos[0], s.pos[1], s.vel[0], s.vel[1]]).toEqual([0, 0, 0, 0]);
  });
});

describe('mesures et indicateur de précision (D-03)', () => {
  it('distance et vitesse', () => {
    const m = mesuresMode1(etatInitialMode1(ELLIPSE));
    expect(m.distance).toBeCloseTo(0.81, 14);
    expect(m.vitesse).toBeCloseTo(8.43, 14);
  });
  it('écart d’énergie normalisé par ½v₀² + μ/r₀, défini pour une parabole', () => {
    const depart = etatInitialMode1(presetMode1('parabole', TERRE));
    expect(ecartEnergie(depart, depart)).toBe(0);
    const { systeme } = simulerMode1(depart, energieSpecifique(depart), 1, 1);
    const ecart = ecartEnergie(etatAstre(systeme), depart);
    expect(Number.isFinite(ecart)).toBe(true);
    expect(ecart).toBeLessThan(1e-4);
  });
});
