# Trajectoires — simulation de trajectoires d’astres

Application web pour **montrer et faire manipuler** à un enfant de 12 ans comment la forme d’une orbite dépend des conditions de départ.

- **Un astre autour du Soleil** : on règle la distance, la vitesse et la direction du lancer (curseurs, saisie, ou directement en glissant l’astre et en tirant sa flèche), et l’on observe la forme obtenue : **cercle, ellipse, parabole, hyperbole**. La forme est annoncée avant le lancement, avec son excentricité, une jauge et les mesures de l’orbite (demi-grand axe, période, périhélie, aphélie, vitesse très loin, déviation).
- **Deux corps** : deux corps de masses réglables s’attirent. On observe le **centre de masse**, l’effet du **rapport des masses** et le **point de vue** (fixe, centre de masse, centré sur A ou sur B).

Repères pédagogiques : vitesse circulaire et vitesse de libération, périhélie/aphélie, foyers, asymptotes, loi des aires, cercle de référence, bulles d’explication optionnelles, aide.

L’application est **statique, hors ligne, sans compte et sans serveur** : aucun appel réseau à l’exécution (polices auto-hébergées). Elle est **installable** (PWA) et fonctionne sans connexion après une première visite. Elle mémorise localement le dernier réglage.

Prévue pour **ordinateur et tablette** (portrait et paysage), utilisable au clavier et au doigt (pincement pour zoomer).

## Utilisation

| Action                   | Comment                                      |
| ------------------------ | -------------------------------------------- |
| Lancer / mettre en pause | bouton principal ou `Espace`                 |
| Recommencer              | bouton ↺ ou `R`                              |
| Avancer d’un pas         | bouton ⏭                                     |
| Vitesse du temps         | ×0,1 · ×1 (1 an = 10 s) · ×10 · ×100         |
| Zoomer                   | boutons − / +, molette, pincement, `+` / `−` |
| Déplacer la vue          | glisser le fond                              |
| Recentrer                | bouton ⌖ ou `0`                              |

**Unités** : distance en UA (1 UA = distance Terre–Soleil), temps en années, vitesse en UA/an, masse en masses du Soleil. Repère : la Terre va à 6,28 UA/an et fait un tour en 1 an. Les corps ne sont **pas dessinés à l’échelle**.

## Développement

Prérequis : Node.js ≥ 22.12.

```bash
npm install
npm run dev        # serveur de développement
npm test           # tests Vitest
npm run coverage   # couverture du module physique (seuil : 90 % des fonctions)
npm run lint       # ESLint + vérification Prettier
npm run build      # vérification des types + build de production dans dist/
npm run preview    # sert le build localement
```

### Architecture

```
src/
  config.ts          constantes configurables (§ 4.4 des spécifications)
  physics/           physique pure, sans React ni DOM, entièrement testée
    kepler.ts        éléments d’orbite, classification analytique, conique, état ↔ éléments
    nbody.ts         système N corps générique
    integrator.ts    saute-mouton, pas adaptatif par image
    mode1.ts mode2.ts presets.ts
  sim/               simulations hors de React (machine d’états, traces, options)
  render/            caméra, points de vue, dessin des scènes (Canvas 2D)
  ui/                composants React
  i18n/fr.ts         tous les textes
  format.ts          nombres au format fr-FR
  storage.ts         mémorisation locale validée
```

Règles du projet : [`CLAUDE.md`](CLAUDE.md). Unités uniques (G = 4π²), radians en interne, classification **analytique** (jamais déduite de la simulation), physique pure et testée.

### Tests

Les tests de `src/physics/` reprennent les tests T-01 à T-15 des spécifications (orbites de référence, conservation de l’énergie et du moment cinétique, cohérence entre orbite prévue et simulée, mode à deux corps…). Les tolérances « à calibrer » ont été **mesurées**, et la valeur mesurée figure en commentaire de chaque test. Un test vérifie aussi le **contraste** (≥ 4,5:1) de chaque couple texte/fond de l’interface.

## Documentation

- [`docs/SPECIFICATIONS.md`](docs/SPECIFICATIONS.md) — spécifications V1 (source de vérité).
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — décisions prises en cours de réalisation (ambiguïtés, écarts, choix techniques) et propositions de modification de la spécification.
- [`docs/maquettes/`](docs/maquettes/) — maquettes des 4 écrans.

## Publication

Chaque envoi sur `main` déclenche le workflow [`publication.yml`](.github/workflows/publication.yml) : lint, tests, build (avec `BASE_PATH=/<nom du dépôt>/`), puis publication sur **GitHub Pages**. Dans les réglages du dépôt, _Pages → Source_ doit être sur **GitHub Actions**.

Pour un autre hébergeur statique : `npm run build` (chemins relatifs par défaut) puis déposer le contenu de `dist/` ; définir `BASE_PATH` si le site est servi dans un sous-dossier.
