# simulation-trajectoire-astre

Application web (statique, hors-ligne) de simulation de trajectoires d'astres, pour un enfant de 12 ans.
**Source de vérité : `docs/SPECIFICATIONS.md`** (exigences `F-…`, tests `T-…`, jalons `J0…J7`). Maquettes : `docs/maquettes/`.

## Règles non négociables

1. **Unités uniques partout** : distance en UA, temps en an, vitesse en UA/an, masse en masse solaire. `G = 4π²` (μ☉ ≈ 39,4784176). Aucune autre unité dans le code physique. Ne jamais mélanger degrés et radians : radians en interne, degrés uniquement à l'affichage et à la saisie.
2. **`src/physics/` est pur** : aucune dépendance à React, au DOM ou au canvas ; fonctions sans effet de bord ; tout y est testé. Aucun calcul physique dans les composants.
3. **La classification d'une trajectoire est analytique** (à partir des conditions initiales), jamais déduite de la simulation. Cas radial (`|h| < 1e-6`) traité à part (§ 5.3 des spécifications).
4. **Repère** : `y` vers le haut en interne ; sens positif = anti-horaire ; inversion de l'axe `y` uniquement au dessin.
5. **Rigueur numérique** : quand une tolérance de test est « à calibrer », la calibrer par mesure, la consigner dans le test avec un commentaire, ne jamais l'élargir pour faire passer un test sans l'expliquer.
6. **Interface en français uniquement** ; tous les textes dans `src/i18n/fr.ts` ; nombres au format fr-FR (virgule décimale, « − » U+2212) via `src/format.ts`. Vocabulaire exact : ellipse, parabole, hyperbole, excentricité, périhélie, aphélie, vitesse de libération.
7. **Aucun appel réseau à l'exécution** (polices auto-hébergées via `@fontsource-*`, pas de CDN).
8. **TypeScript `strict`**, pas de `any` sans commentaire justificatif. ESLint et Prettier sans avertissement.
9. **Accessibilité** : contrôles natifs, zones tactiles ≥ 44 px, contraste ≥ 4,5:1, pas d'information portée par la couleur seule.

## Commandes
- `npm run dev` — serveur de développement
- `npm test` — tests Vitest (physique d'abord)
- `npm run build` — build de production (doit passer sans avertissement)
- `npm run lint` — ESLint + vérification Prettier

## Méthode de travail
- Avancer **jalon par jalon** (J0 → J7 dans `docs/SPECIFICATIONS.md` § 10). Ne pas commencer un jalon avant que le précédent soit vert.
- Avant d'écrire du code d'un jalon : annoncer le plan (fichiers, fonctions, tests). Écrire les tests physiques **avant ou avec** l'implémentation.
- À la fin de chaque jalon : lancer tests + build + lint, résumer ce qui est fait, ce qui ne l'est pas, et les écarts avec les spécifications ; puis **un commit** : `type(F-xxx): description` (types : feat, fix, test, docs, refactor, chore).
- En cas d'ambiguïté ou de conflit entre la spécification et une maquette : le comportement suit la spécification, l'apparence suit la maquette. Si la spécification elle-même est ambiguë ou semble erronée, **poser la question** plutôt que d'inventer, et consigner la décision dans `docs/DECISIONS.md`.
- Ne jamais modifier `docs/SPECIFICATIONS.md` sans que l'utilisateur l'ait demandé ; proposer la modification et la consigner dans `docs/DECISIONS.md`.
- Toute valeur issue d'une source externe (éléments orbitaux, etc.) est référencée avec sa source en commentaire.

## Conventions de code
- Noms de fichiers en `kebab-case` ou `camelCase` homogènes dans un même dossier ; types explicites exportés (`Vec2`, `BodyState`, `OrbitElements`, `ShapeClass`).
- Constantes configurables uniquement dans `src/config.ts` (jamais de nombre magique dans la physique).
- Composants React petits ; l'état de simulation vit hors de React ; pas de re-rendu React à chaque image d'animation.
