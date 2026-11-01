# Simulation de trajectoire d'astres — Spécifications V1

| | |
|---|---|
| **Projet** | `simulation-trajectoire-astre` |
| **Version du document** | 1.0 — 1er novembre 2026 |
| **Auteur / commanditaire** | Alban Normandin |
| **Public cible** | Un collégien de 12 ans (5ᵉ, très bon niveau, ouvert aux notions simples de lycée) |
| **Maquettes** | `docs/maquettes/` (exports) — source : canevas Claude « Simulation de trajectoire d'astres — maquettes » (4 écrans) |

---

## 1. Objectif

Application web de simulation de trajectoires de corps célestes, destinée à **montrer et faire manipuler** à un enfant comment la forme d'une orbite dépend des conditions de départ.

Deux modes :

1. **Un astre autour du Soleil** : le Soleil est fixe, l'astre est un point de masse négligeable. On règle distance, vitesse et direction de départ, et on observe les différentes formes : **cercle, ellipse, parabole, hyperbole**.
2. **Deux corps** : deux corps de masses réglables s'attirent mutuellement. On observe le **centre de masse**, l'effet du **rapport des masses**, et le changement de **point de vue** (référentiel).

Qualités recherchées, par ordre de priorité : **exactitude physique**, **réaction immédiate à chaque réglage**, **lisibilité pour un enfant**, **fonctionnement sur ordinateur et tablette**.

## 2. Principes de conception

- **Vrai vocabulaire** : ellipse, parabole, hyperbole, excentricité, périhélie, aphélie, vitesse de libération. Pas de vocabulaire édulcoré. Les termes sont expliqués dans des bulles optionnelles (§ 6.7).
- **Pas de formule affichée par défaut.** Les bulles d'explications (option) peuvent en contenir de très simples.
- **Direct et manipulable** : on glisse l'astre pour choisir sa position et on tire une flèche pour choisir sa vitesse ; les curseurs et les champs numériques sont synchronisés avec ces gestes.
- **Visualiser avant de lancer** : la trajectoire théorique est tracée en pointillés pendant le réglage (option désactivable).
- **Le moteur dit vrai** : la forme annoncée (classification) est calculée analytiquement ; la simulation numérique doit la confirmer (voir tests, § 9).
- **Hors-ligne, sans compte, sans serveur** : application statique.

## 3. Périmètre

### 3.1 Inclus en V1
- Les deux modes décrits ci-dessus, avec préréglages.
- Contrôles de simulation (lancer/pause, pas à pas, recommencer, vitesse du temps, zoom/déplacement/recentrer).
- Classification de la trajectoire, mesures de l'orbite, repères pédagogiques (vitesse circulaire, vitesse de libération, périhélie/aphélie, foyers, asymptotes, loi des aires, cercle de référence).
- Bulles d'explication optionnelles.
- Ordinateur et tablette (portrait et paysage).
- Mémorisation locale du dernier réglage.

### 3.2 Exclu de la V1 (« plus tard »)
Défis ludiques, mode 3 corps ou plus, plusieurs astres simultanés autour du Soleil, vue 3D, partage de configuration par lien, sauvegarde nommée, téléphone (< 700 px de large : l'application ne doit pas être cassée mais n'est pas optimisée), effets relativistes, collisions avec fusion, orbites non coplanaires.

## 4. Unités, constantes, conventions

### 4.1 Système d'unités (unique, partout)

| Grandeur | Unité | Symbole affiché |
|---|---|---|
| Distance | unité astronomique (distance Terre–Soleil) | **UA** |
| Temps | année | **an** |
| Vitesse | UA par an | **UA/an** |
| Masse | masse du Soleil | **× Soleil** |

- **Constante gravitationnelle** : `G = 4π²` UA³·an⁻²·(masse solaire)⁻¹, soit `μ☉ = G·M☉ ≈ 39,4784176`. C'est la 3ᵉ loi de Kepler normalisée : a = 1 UA, M = 1 → T = 1 an.
- La Terre est un repère : à 1 UA du Soleil, sa vitesse circulaire vaut `2π ≈ 6,2832` UA/an. L'interface rappelle ce repère près du curseur de vitesse.
- Aucune conversion en km ou km/s dans l'interface en V1 (éventuellement dans les bulles).
- Convention pédagogique : la masse de l'astre est négligée en mode 1 ; l'« année » est celle d'une planète de masse négligeable à 1 UA du Soleil.

### 4.2 Conventions géométriques
- Repère plan : `x` vers la droite, `y` vers le **haut** (en interne). L'axe écran est inversé uniquement à l'affichage.
- Sens de rotation positif = **anti-horaire** (celui des planètes vues « du dessus »).
- Angles : degrés dans l'interface, radians en interne.
- **Direction du lancer θ** (mode 1) : angle entre le vecteur vitesse et la direction **radiale sortante** (Soleil → astre). `0°` = s'éloigne du Soleil ; `90°` = perpendiculaire (tangentiel) ; `180°` = plonge vers le Soleil.

### 4.3 Format des nombres
- Affichage `fr-FR` : virgule décimale, signe moins typographique « − » (U+2212), espace fine insécable pour les milliers.
- Saisie tolérante : `,` ou `.` ; `-` ou `−`.
- Précision d'affichage : 2 décimales (distance, vitesse, masse, périodes, axes) ; excentricité à 2 décimales, **3 décimales si |e − 1| < 0,05** ; angles entiers.

### 4.4 Paramètres techniques (constantes configurables, fichier unique `config.ts`)

| Nom | Valeur par défaut | Rôle |
|---|---|---|
| `R_COLLISION` | 0,05 UA | Distance de contact (Soleil–astre ; A–B). Valeur pédagogique, volontairement supérieure au rayon réel |
| `R_SORTIE` | 100 UA | Au-delà, si l'énergie est ≥ 0, l'astre est considéré comme parti pour toujours |
| `TOL_CERCLE` | 0,01 | Un e < 0,01 est affiché « cercle » |
| `TOL_PARABOLE` | 0,01 | Un |e − 1| ≤ 0,01 est affiché « parabole » |
| `ETA` | 0,002 | Facteur du pas de temps adaptatif (§ 5.6) |
| `TEMPS_X1` | 0,1 an/s | Vitesse du temps « ×1 » : 1 an = 10 s à l'écran |
| `MAX_SOUS_PAS` | 5000 | Sous-pas maximum par image |
| `TRAINEE_MAX` | 50 000 points | Taille du tampon de trace par corps |

## 5. Modèle physique

### 5.1 Mode 1 — Données d'entrée et état initial

Entrées utilisateur : `r₀` (UA), `v₀` (UA/an), `θ` (°), `s` = ±1 (sens de rotation, +1 = anti-horaire, défaut), `φ₀` (angle polaire de la position de départ, fixé par le glisser de l'astre ; sans effet physique, seulement visuel).

```
μ   = 4π²
r⃗₀  = r₀ (cos φ₀, sin φ₀)         r̂ = r⃗₀/r₀       φ̂ = (−sin φ₀, cos φ₀)
v⃗₀  = v₀ (cos θ · r̂ + s · sin θ · φ̂)
```

### 5.2 Grandeurs conservées et éléments de l'orbite

```
ε  = v²/2 − μ/r                    (énergie par unité de masse, conservée)
h  = x·vy − y·vx                   (moment cinétique par unité de masse, signé, conservé)
p  = h²/μ                          (paramètre de la conique)
e  = √(1 + 2·ε·h²/μ²)              (excentricité ; argument ramené à 0 s'il est < 0 par erreur d'arrondi)
e⃗  = ((v² − μ/r)·r⃗ − (r⃗·v⃗)·v⃗)/μ  (vecteur de Laplace–Runge–Lenz ; direction du périhélie = atan2(e_y, e_x))
a  = −μ/(2ε)                       (ε ≠ 0 ; négatif pour une hyperbole)
```

| Forme | Condition | Grandeurs dérivées |
|---|---|---|
| **Ellipse / cercle** | ε < 0 | `rp = a(1−e)`, `ra = a(1+e)`, `b = a√(1−e²)`, `c = a·e` (distance centre–foyer), `T = 2π√(a³/μ) = a^(3/2)` (an, avec a en UA) |
| **Parabole** | ε = 0 | `rp = p/2` ; vitesse à l'infini nulle |
| **Hyperbole** | ε > 0 | `|a| = μ/(2ε)`, `rp = |a|(e−1)`, **vitesse à l'infini** `v∞ = √(2ε)`, **angle de déviation** `δ = 2·asin(1/e)`, **angle des asymptotes** `ν∞ = acos(−1/e)` |

Repères de vitesse à la distance courante `r` : `v_circ = √(μ/r) = 2π/√r` et `v_lib = √2 · v_circ`.

Équation polaire de la trajectoire : `r(ν) = p / (1 + e·cos ν)`, `ν` mesuré depuis le périhélie. Pour construire un état à partir d'éléments (utile aux préréglages) :
```
r = p/(1 + e cos ν)      v_r = √(μ/p) · e · sin ν      v_t = √(μ/p) · (1 + e cos ν)
v = √(v_r² + v_t²)       θ = atan2(v_t, v_r)  (pour s = +1)
```

### 5.3 Classification (mode 1)

Déterminée **analytiquement à partir des conditions initiales**, jamais déduite de la simulation :

1. Si `|h| < 10⁻⁶` → **trajectoire droite** (radiale) : « L'astre tombe droit sur le Soleil » si ε < 0, sinon « l'astre part en ligne droite ». Pas de conique. (Cas dégénéré : e vaut formellement 1 quelle que soit l'énergie, la classification par e serait fausse.)
2. Sinon, selon `e` : `e < TOL_CERCLE` → **cercle** ; `e < 1 − TOL_PARABOLE` → **ellipse** ; `|e − 1| ≤ TOL_PARABOLE` → **parabole** (affichée « parabole » avec mention « presque » si e ≠ 1 exactement) ; sinon **hyperbole**.
3. Ensuite, le simulateur détecte les **collisions** : si `rp < R_COLLISION` la trajectoire est annoncée « ira percuter le Soleil » (avertissement avant lancement).

**Position du repère sur la jauge** (largeurs des 4 segments : cercle 14 %, ellipse 46 %, parabole 14 %, hyperbole 26 %) :
cercle → centre du segment ; ellipse → `14 + e·46` % ; parabole → centre du segment ; hyperbole → `74 + min((e−1)/2, 1)·26` %.

### 5.4 Trajectoire prévue (conique analytique)

- Échantillonner `ν` sur ~400 points et tracer `r(ν)` en pointillés.
- Ellipse : `ν ∈ [−π, π]`. Parabole / hyperbole : `|ν| < ν_lim` avec `ν_lim = min(acos((p/R_vue − 1)/e), ν∞)` où `R_vue` est le rayon maximal visible.
- **Doit coïncider avec la trajectoire simulée** (test d'acceptation § 9).
- Désactivable (bouton « Orbite prévue »).

### 5.5 Mode 2 — Deux corps

État : pour chaque corps `i ∈ {A, B}` : masse `mᵢ ∈ [0,01 ; 10]` (× Soleil), position `r⃗ᵢ`, vitesse `v⃗ᵢ` (UA, UA/an). Accélération : `a⃗ᵢ = −G·mⱼ·(r⃗ᵢ − r⃗ⱼ)/|r⃗ᵢ − r⃗ⱼ|³`.

Grandeurs :
```
M = mA + mB          G_cm = (mA·r⃗A + mB·r⃗B)/M          V_cm = (mA·v⃗A + mB·v⃗B)/M
r⃗_rel = r⃗B − r⃗A     v⃗_rel = v⃗B − v⃗A                   μ_rel = 4π² · M
```
L'orbite **relative** est une conique de paramètre `μ_rel` : on lui applique **exactement** les formules du § 5.2 (ε, h, e, a, T, rp, ra…) avec `μ = μ_rel`, `r⃗ = r⃗_rel`, `v⃗ = v⃗_rel`. Période : `T = √(a³/M)` (an).

Chaque corps décrit, dans le référentiel du centre de masse, une conique **semblable à l'orbite relative** :
`r⃗A = −(mB/M)·r⃗_rel` et `r⃗B = +(mA/M)·r⃗_rel`. Le plus léger décrit la plus grande orbite.

**Corps liés** ⇔ `ε_rel < 0` (indépendant du référentiel). Affichage « Corps liés » / « Corps non liés (ils se séparent) ».

**État initial à partir d'éléments** (préréglages) : calculer `(r⃗_rel, v⃗_rel)` par les formules du § 5.2 avec `μ_rel`, puis `r⃗A = −(mB/M) r⃗_rel`, `r⃗B = (mA/M) r⃗_rel`, `v⃗A = −(mB/M) v⃗_rel`, `v⃗B = (mA/M) v⃗_rel` (barycentre à l'origine, vitesse totale nulle).

### 5.6 Référentiels (mode 2)

La simulation tourne toujours dans le référentiel initial (« fixe »). Les autres points de vue sont des **transformations d'affichage** :

| Point de vue | Origine affichée |
|---|---|
| Fixe | origine du repère initial |
| Centre de masse | `G_cm(t)` |
| Centré sur A / B | `r⃗A(t)` / `r⃗B(t)` |

L'orbite prévue (§ 5.4) est une courbe **statique** dans les points de vue « centre de masse » (deux coniques) et « centré sur A/B » (une conique, celle de `r⃗_rel`). Dans le point de vue « fixe » avec `V_cm ≠ 0`, elle ne l'est plus : elle est alors **masquée** (le bouton reste visible, grisé, avec une info-bulle explicative).

### 5.7 Intégration numérique

- Schéma **saute-mouton (leapfrog / vitesse-Verlet)** : réversible, bon pour la conservation de l'énergie sur de longues durées.
- **Pas adaptatif par image** : à chaque image, `dt_max = ETA · √(d_min³ / (G·M_tot))` où `d_min` est la plus petite distance (corps–Soleil en mode 1, A–B en mode 2) estimée en début d'image avec une marge ; le pas reste constant à l'intérieur de l'image ; nombre de sous-pas = `ceil(Δt_image / dt_max)`, plafonné à `MAX_SOUS_PAS`. Si le plafond est atteint, la vitesse effective est réduite et un indicateur discret « simulation ralentie » s'affiche.
- **Vitesse du temps** : `×1` = `TEMPS_X1` (1 an = 10 s), `×0,1`, `×10`, `×100` ; défaut `×1` (les maquettes montrent ×10 pour l'illustration).
- **Indicateur de précision** : écart relatif d'énergie `|ΔE/E₀|` ; pastille discrète « précision correcte » si < 10⁻⁴, orange sinon (détail dans une info-bulle).
- **Fins de simulation** : mode 1 : `r < R_COLLISION` → « Collision avec le Soleil » ; `r > R_SORTIE` avec ε ≥ 0 → « L'astre s'éloigne pour toujours ». Mode 2 : `d < R_COLLISION` → « Contact entre les deux corps » ; `d > R_SORTIE` avec `ε_rel ≥ 0` → « Les corps se séparent ». La simulation s'arrête, la trace reste affichée, le bouton devient « Recommencer ».

## 6. Spécifications fonctionnelles

Chaque exigence porte un identifiant (`F-…`) repris dans les tests et les commits.

### 6.1 Structure de l'application
- **F-APP-1** Deux modes accessibles par un sélecteur dans l'en-tête ; changer de mode conserve les réglages propres à chaque mode.
- **F-APP-2** Bouton « Explications » (interrupteur) activant/désactivant les bulles pédagogiques (désactivé par défaut) ; bouton d'aide « ? ».
- **F-APP-3** Mémorisation locale (dernier mode, réglages de chaque mode, interrupteur d'explications, vitesse du temps) avec garde `try/catch` ; l'application fonctionne sans stockage.
- **F-APP-4** États de la simulation : `Édition` (t = 0, réglages libres) → `En cours` ↔ `Pause` → `Terminée` (collision / sortie). Modifier un réglage pendant `En cours`/`Pause` ramène à `Édition` (t = 0).
- **F-APP-5** Conservation des anciennes traces : à chaque nouveau lancement, la trace précédente reste affichée en atténué (jusqu'à 3 traces) pour comparer ; bouton « Effacer les traces ».
- **F-APP-6** Clavier : `Espace` = lancer/pause ; `R` = recommencer ; `+`/`−` = zoom ; `0` = recentrer. Tous les contrôles sont accessibles au clavier.

### 6.2 Commandes de simulation (communes)
- **F-SIM-1** Lancer / Pause (bouton principal), avancer d'un pas (≈ 1/60 s à la vitesse courante), recommencer.
- **F-SIM-2** Vitesse du temps : ×0,1 / ×1 / ×10 / ×100.
- **F-SIM-3** Zoom (boutons, molette, pincement), déplacement (glisser le fond), « Recentrer » (cadrage automatique).
- **F-SIM-4** **Cadrage automatique** : à chaque changement de réglage tant que l'utilisateur n'a pas zoomé/déplacé manuellement ; il contient l'orbite prévue (ellipse entière ; orbite ouverte : jusqu'à `R_vue = max(2·r₀, 4·rp)`), plus le Soleil. « Recentrer » le réactive.
- **F-SIM-5** Corps dessinés **sans échelle** (rayon constant en pixels : Soleil 22 px ; astre mode 1 : 10 px ; mode 2 : `clamp(13·m^(1/3), 5, 26)` px). Une mention « pas à l'échelle » figure dans l'aide.
- **F-SIM-6** Mesures en direct (tuiles au-dessus de la simulation) : mode 1 = distance, vitesse, temps écoulé ; mode 2 = distance A–B, vitesse relative, temps écoulé.

### 6.3 Mode 1 — Un astre autour du Soleil
- **F-M1-1** Réglages : distance au Soleil `r₀ ∈ [0,3 ; 5]` UA ; vitesse `v₀ ∈ [0 ; 12]` UA/an ; direction `θ ∈ [0° ; 180°]`. Chaque curseur est doublé d'une saisie numérique. Sens de rotation ↺/↻ (voir § 11, point 1).
- **F-M1-2** Réglage direct en édition : glisser l'astre (modifie `r₀` et `φ₀`, dans les bornes) ; tirer la flèche de vitesse (modifie `v₀`, `θ` et le sens). Longueur de la flèche : 12 px par UA/an (bornée à [10 ; 200] px).
- **F-M1-3** **Repères sur le curseur de vitesse** : « circulaire » (`v_circ`) et « libération » (`v_lib`) à la distance `r₀` courante, cliquables (calent la valeur exacte). **Aimant** : à moins de 3 % d'un repère, la flèche s'y aligne (désactivable).
- **F-M1-4** Rappel « la Terre va à 6,28 UA/an » sous le curseur de vitesse.
- **F-M1-5** **Forme de la trajectoire** : nom de la forme en grand, couleur dédiée (cercle vert, ellipse bleu, parabole jaune, hyperbole orange), excentricité `e`, jauge à 4 segments avec repère (§ 5.3). Cas particuliers : trajectoire droite, collision annoncée.
- **F-M1-6** **Mesures de l'orbite** : ellipse = demi-grand axe, période, périhélie, aphélie ; hyperbole = demi-grand axe, périhélie, vitesse très loin (`v∞`), déviation ; parabole = périhélie, vitesse très loin = 0.
- **F-M1-7** **Affichages** (boutons bascule) : Orbite prévue (activé), Périhélie/aphélie (activé ; « Périhélie » seul pour les orbites ouvertes), Foyers (désactivé), Cercle de référence (désactivé : cercle de rayon `r₀`), Asymptotes (hyperbole), Loi des aires (désactivé).
- **F-M1-8** **Loi des aires** : secteurs coloriés alternés balayés depuis le Soleil en des durées égales `Δt = T/12` (ellipse) ou `Δt = rp^(3/2)/12` (orbite ouverte) ; les 6 derniers sont conservés.
- **F-M1-9** Point de départ matérialisé (cercle en pointillés « départ ») et flèche de vitesse fantôme pendant et après la simulation.
- **F-M1-10** Distance Soleil–astre : trait pointillé et valeur en direct.

### 6.4 Mode 2 — Deux corps
- **F-M2-1** Onglets « Corps A » / « Corps B » ; pour le corps sélectionné : masse (curseur **logarithmique** 0,01 → 10, graduations 0,01 · 0,1 · 1 · 10), position (x, y) en UA, vitesse (vx, vy) en UA/an (champs numériques). Glisser les corps et tirer leurs flèches fonctionne comme en mode 1.
- **F-M2-2** Point de vue : Fixe / Centre de masse (défaut) / Centré sur A / Centré sur B (§ 5.6).
- **F-M2-3** Affichages : Orbites prévues, Traînées, Centre de masse (croix), Ligne A–B (pointillés passant par le centre de masse), Flèches de vitesse (désactivé par défaut).
- **F-M2-4** Bloc « Le duo » : état « Corps liés / non liés » (§ 5.5), rapport de masses (« A = 2 × B »), excentricité relative, période (si liés), demi-grand axe relatif.
- **F-M2-5** Couleurs : A bleu ciel, B orange ; légendes « A », « B », masses sous les corps.
- **F-M2-6** Collision/contact et séparation : § 5.7.

### 6.5 Préréglages

Les préréglages sont **définis par éléments orbitaux** et convertis en état initial par les formules du § 5.2/5.5 (jamais par valeurs figées).

**Mode 1**

| Préréglage | Définition | État de départ (arrondi) |
|---|---|---|
| Terre | cercle, r = 1 UA | `r₀ = 1`, `v₀ = 6,28`, `θ = 90°` |
| Mars | `a = 1,5237 UA`, `e = 0,0934` ; départ à l'aphélie | `r₀ = 1,67`, `v₀ = 4,63`, `θ = 90°` |
| Comète de Halley | `e = 0,967`, `q = 0,59 UA` (a ≈ 17,9 UA, T ≈ 75,6 ans) ; départ au périhélie | `r₀ = 0,59`, `v₀ = 11,47`, `θ = 90°` |
| Comète hyperbolique | `e = 1,6`, `rp = 0,9 UA` (|a| = 1,5 UA) ; départ à ν = −105° | `r₀ = 3,99`, `v₀ = 6,79`, `θ = 159°` |
| Orbite circulaire | à la distance courante `r₀` | `v₀ = 2π/√r₀`, `θ = 90°` |
| Parabole | vitesse de libération à 1 UA | `r₀ = 1`, `v₀ = 8,89`, `θ = 90°` |

Sources des éléments (à re-vérifier à l'implémentation, valeurs arrondies à vocation pédagogique) : Mars — NASA Goddard Space Flight Center, Mars Fact Sheet (a = 1,52366 UA ; e = 0,09341). Halley — les sources divergent légèrement (e entre 0,9666 et 0,9679 ; q entre 0,575 et 0,593 UA ; période ≈ 75–76 ans selon l'époque des éléments) : valeurs arrondies `e = 0,967`, `q = 0,59 UA` retenues.

**Mode 2** (barycentre à l'origine, vitesse totale nulle, départ à l'apoastre pour les ellipses)

| Préréglage | Masses A / B | Orbite relative |
|---|---|---|
| Masses égales | 1 / 1 | cercle, `a = 2 UA` |
| Gros et petit (10 : 1) | 1 / 0,1 | ellipse, `a = 2 UA`, `e = 0,5` |
| Planète – Soleil (1 : 100) | 1 / 0,01 | cercle, `a = 1 UA` |
| Un visiteur qui passe | 1 / 0,1 | hyperbole, `e = 1,5`, `rp = 1 UA`, départ à 6 UA |
| Orbite circulaire | masses courantes | cercle à la distance courante |

Le préréglage « Terre – Lune » de la première maquette est **retiré** : le rapport réel (≈ 81 : 1, masses ≈ 3·10⁻⁶ et 4·10⁻⁸ masse solaire) sort de la plage de masses du curseur.

### 6.6 Textes et libellés
- Tous les textes sont dans un fichier unique `src/i18n/fr.ts` (français uniquement en V1).
- Formes : « cercle », « ellipse », « parabole », « hyperbole ». Verbes d'action : « Lancer », « Pause », « Recommencer », « Recentrer ».

### 6.7 Bulles d'explication (option « Explications »)

Bulles courtes (2 phrases maximum), niveau collège, affichées dans le panneau (sous le contrôle concerné) et, pour deux d'entre elles, sur la simulation. Texte initial (modifiable) :

| Sujet | Texte |
|---|---|
| Forme de la trajectoire | « L'excentricité mesure l'écart à un cercle : 0 pour un cercle, entre 0 et 1 pour une ellipse, 1 pour une parabole, plus de 1 pour une hyperbole. » |
| Vitesse de libération | « À cette distance, il faut aller à [v_lib] UA/an pour échapper au Soleil. Ici, [v₀] : [c'est largement assez / ce n'est pas assez]. » |
| Ellipse (énergie < 0) | « L'astre est trop lent pour s'échapper : il reste prisonnier du Soleil et revient toujours. » |
| Hyperbole (énergie > 0) | « Cet astre va plus vite que la vitesse de libération : il est attiré par le Soleil, mais ne reviendra jamais. » |
| Asymptotes / déviation | « Les pointillés gris sont les asymptotes : très loin du Soleil, l'astre les suit presque en ligne droite. Son trajet est dévié de [δ]°. » |
| Loi des aires | « En des durées égales, l'astre balaie des surfaces égales : il va donc plus vite près du Soleil. » |
| Périhélie / aphélie | « Le périhélie est le point le plus proche du Soleil, l'aphélie le plus éloigné. » |
| Centre de masse | « C'est le point d'équilibre du duo. Les deux corps tournent autour de lui, le plus léger fait la plus grande orbite. » |
| Corps liés / non liés | « Si l'énergie totale est négative, les deux corps restent ensemble ; sinon ils se séparent. » |
| Point de vue | « Change de point de vue : dans celui du centre de masse, le duo tourne sur place. » |

## 7. Interface

Référence visuelle : maquettes `docs/maquettes/` (4 écrans). En cas d'écart entre ce document et une maquette, **ce document prévaut** pour le comportement ; la maquette prévaut pour l'apparence.

### 7.1 Disposition
- **Ordinateur (≥ 1100 px)** : en-tête ; colonne gauche = simulation (barre « Afficher » + tuiles de mesures, zone de dessin, barre de commandes) ; colonne droite = panneau de réglages de 380 px.
- **Tablette (700–1099 px, portrait ou paysage)** : en-tête compact ; tuiles ; barre « Afficher » ; simulation pleine largeur ; commandes ; **volet de réglages en bas** (déplié par défaut, repliable par la poignée).
- Zones tactiles ≥ 44 px ; aucune fonction accessible uniquement au survol.

### 7.2 Charte (extraite des maquettes)

| Jeton | Valeur |
|---|---|
| Fond application / simulation | `#070B17` / `#050813` |
| En-tête / panneau | `#0D1428` / `#0F1730` |
| Carte / bulle | `#19233F` / `#1F2C52` (bordure `#3B4C7E`) |
| Bordures | `#223056`, `#2F3F6C` |
| Texte / texte secondaire | `#EAF0FF` / `#AAB8DA` |
| Accent principal (boutons, curseurs, Soleil) | `#FFC857` (texte dessus `#0A0F1E`) |
| Cercle / Ellipse / Parabole / Hyperbole | `#5FD9B4` / `#6FA8FF` / `#FFC857` / `#FF8A5B` |
| Corps A / Corps B | `#5CD0F0` / `#FF8A5B` |
| Polices | titres *Bricolage Grotesque* (600/700), texte *Figtree*, valeurs numériques *IBM Plex Mono* ; **à auto-héberger** (paquets `@fontsource-*`) pour le fonctionnement hors ligne |

Rayons : cartes 12–16 px ; boutons « pilule » 999 px.

### 7.3 Accessibilité
- Contraste texte ≥ 4,5:1 ; les formes ne sont pas distinguées par la couleur seule (nom en toutes lettres + position sur la jauge).
- Contrôles natifs (`button`, `input`, `label`), `aria-label` sur les boutons-icônes, `role="switch"` pour « Explications », `aria-pressed` pour les boutons bascule, `aria-live="polite"` pour l'annonce de la forme et des fins de simulation.
- Alternative textuelle du dessin (`role="img"` + `aria-label` résumant la situation).
- Respect de `prefers-reduced-motion` (pas d'animation décorative ; la simulation reste pilotée par l'utilisateur).

## 8. Architecture technique

### 8.1 Pile
React + TypeScript (`strict`) + Vite ; dessin sur **Canvas 2D** (gestion du `devicePixelRatio`) ; événements **Pointer Events** (souris, tactile, stylet) ; tests **Vitest** ; ESLint + Prettier. Aucun appel réseau à l'exécution. Déploiement : site statique (GitHub Pages possible, `base` de Vite configurable). PWA hors-ligne : option en fin de projet.

### 8.2 Arborescence cible
```
simulation-trajectoire-astre/
  CLAUDE.md
  docs/
    SPECIFICATIONS.md
    maquettes/                 (exports PNG/PDF des 4 écrans)
  src/
    config.ts                  constantes du § 4.4
    physics/                   AUCUNE dépendance à React ni au DOM
      constants.ts             MU_SOLEIL = 4π², conversions
      kepler.ts                éléments, classification, conique, état↔éléments
      integrator.ts            leapfrog, pas adaptatif
      nbody.ts                 accélérations, barycentre, N corps générique
      mode1.ts, mode2.ts       états initiaux, mesures, fins de simulation
      presets.ts               préréglages définis par éléments
      *.test.ts
    sim/                       boucle d'animation, machine d'états, vitesse du temps
    render/                    caméra, dessin de scène, tracés, thème
    ui/                        composants React (panneau, commandes, jauge, bulles…)
    i18n/fr.ts                 tous les textes
    format.ts                  formatage et lecture des nombres fr-FR
    storage.ts                 mémorisation locale sécurisée
```

### 8.3 Principes
- Le **module `physics/` est pur et testable** : fonctions sans effet de bord, types explicites (`Vec2`, `BodyState`, `OrbitElements`, `ShapeClass`).
- Le moteur est un **intégrateur N corps générique** utilisé avec N = 2 (prépare le mode 3 corps) ; le mode 1 est le cas « corps fixe + corps d'épreuve ».
- L'état de simulation vit hors de React (store léger) ; React ne rend que l'interface autour du canvas ; la boucle `requestAnimationFrame` ne déclenche pas de re-rendu React à chaque image (mesures rafraîchies à ~10 Hz).
- Traces : tampon circulaire (`Float32Array`), échantillonnage par distance écran minimale, redessin depuis le tampon.
- Toute grandeur physique affichée vient de `physics/` ; aucun calcul physique dans les composants.

## 9. Tests et critères d'acceptation

### 9.1 Tests unitaires (Vitest) — physique
Tolérances à ajuster à l'implémentation (marquées « à calibrer »).

| Réf. | Test | Attendu |
|---|---|---|
| T-01 | Terre : `r₀=1`, `v₀=2π`, `θ=90°` | `e < 10⁻⁹`, classe cercle, `T = 1 an` |
| T-02 | Intégration d'un tour de la Terre | retour au point de départ à < 10⁻⁴ UA ; dérive d'énergie < 10⁻⁶ (à calibrer) |
| T-03 | Ellipse maquette : `r₀=0,81`, `v₀=8,43`, `θ=64°` | `e ≈ 0,60 ± 0,01`, `a ≈ 1,50 ± 0,02`, `T ≈ 1,84 ± 0,05`, `rp ≈ 0,60`, `ra ≈ 2,40` |
| T-04 | Hyperbole maquette : `r₀=3,99`, `v₀=6,79`, `θ=159°` | `e ≈ 1,60 ± 0,02`, `|a| ≈ 1,50 ± 0,02`, `rp ≈ 0,90 ± 0,02`, `v∞ ≈ 5,13 ± 0,03`, `δ ≈ 77° ± 1°` |
| T-05 | Parabole : `v₀ = v_lib(r₀)` | `e = 1 ± 10⁻⁹`, classe parabole ; `v₀ = 1,0 × v_lib × (1 ± 0,001)` encore « parabole » |
| T-06 | Chute radiale : `θ = 0` ou `180°` | classe « trajectoire droite » (pas de conique) |
| T-07 | Conservation sur 10 orbites (e = 0,6) | `|ΔE/E| < 10⁻⁴`, `|Δh/h| < 10⁻⁶` (à calibrer) |
| T-08 | Halley (préréglage) sur une orbite | `|ΔE/E| < 10⁻³` ; période simulée = `a^(3/2)` à 0,5 % près (à calibrer) |
| T-09 | Cohérence prévision / simulation | écart max entre points simulés et conique analytique < 10⁻³ UA (ellipse e=0,6, 1 tour) |
| T-10 | Mode 2, barycentre | `V_cm` constante (< 10⁻⁹), `G_cm(t) = G_cm(0) + V_cm·t` |
| T-11 | Mode 2, conique relative | masses 2 et 1, `r_rel = (0 ; 2,48)`, `v_rel = (−6,92 ; 3,46)` : `a ≈ 3,3 ± 0,05`, `e ≈ 0,50 ± 0,01`, `T ≈ 3,46 ± 0,05` |
| T-12 | Mode 2, préréglage « Masses égales » | orbite relative circulaire (`e < 10⁻⁶`) ; `v_rel = 2π` ; chaque corps `π` en sens opposés |
| T-13 | Mode 2, rapports | `|r⃗A|/|r⃗B| = mB/mA` à chaque instant |
| T-14 | Fins de simulation | collision détectée pour `rp < R_COLLISION` ; sortie à `R_SORTIE` si ε ≥ 0 |
| T-15 | Formatage | `format(−0,8)` = « −0,80 » ; lecture de « 1,5 », « 1.5 », « −2,31 », « −2,31 » (U+2212) |

### 9.2 Scénarios d'acceptation (à dérouler avec l'enfant)
1. Choisir « Terre » → cercle ; la jauge est dans « Cercle » ; période 1 an.
2. Augmenter la vitesse de départ depuis la Terre → ellipse de plus en plus allongée, puis parabole au repère « libération », puis hyperbole.
3. Diminuer la vitesse → l'astre plonge, « ira percuter le Soleil » s'affiche.
4. Activer « Loi des aires » sur une ellipse : les secteurs d'aire égale sont visibles.
5. Basculer sur « Comète hyperbolique » avec les explications : asymptotes et déviation affichées.
6. Mode 2, « Masses égales » puis augmenter la masse de A : l'orbite de A rétrécit, celle de B grandit.
7. Mode 2, point de vue « Centré sur A » : B décrit une seule ellipse autour de A.
8. Sur tablette : tout est utilisable au doigt, le volet se replie, aucun défilement horizontal.

### 9.3 Critères transverses
- 60 images/s sur un ordinateur portable courant et fluidité sur tablette récente avec traces pleines.
- Aucune erreur dans la console ; `npm run build` sans avertissement TypeScript ; couverture des fonctions de `physics/` ≥ 90 %.

## 10. Plan de réalisation (jalons)

| Jalon | Contenu | Critère de passage |
|---|---|---|
| **J0** | Squelette Vite/React/TS strict, lint, tests, `config.ts`, `fr.ts`, polices auto-hébergées, `CLAUDE.md` | `npm run dev/build/test` OK |
| **J1** | Module physique mode 1 : éléments, classification, conique, intégrateur, préréglages | T-01 à T-09, T-14 verts |
| **J2** | Rendu mode 1 (caméra, Soleil, astre, trace, prévision) + commandes de simulation | Terre et ellipse animées et fluides |
| **J3** | Panneau mode 1 : curseurs/saisies, jauge, mesures, repères de vitesse, glisser/flèche, affichages | Scénarios 1 à 4 |
| **J4** | Module et rendu mode 2 + référentiels + panneau | T-10 à T-13 verts ; scénarios 6 et 7 |
| **J5** | Bulles d'explication, aide, préréglages complets, mémorisation locale | Scénario 5 |
| **J6** | Tablette (volet, tactile, pincement), accessibilité, performance | Scénario 8 ; contraste et clavier vérifiés |
| **J7** | Finitions, déploiement statique, (option) PWA, README | Publication |

Chaque jalon se termine par : tests verts, démonstration locale, **un commit** (messages de commit au format `type(F-xxx): …`).

## 11. Points ouverts et écarts avec les maquettes

À trancher ou à intégrer lors du jalon concerné (aucun ne bloque J0–J2) :

1. **Sens de rotation** (↺/↻) : absent des maquettes ; nécessaire pour couvrir les lancers « à gauche » et « à droite » avec un angle 0–180°. Proposition : bouton à deux états à côté du curseur de direction, piloté aussi par le glisser de la flèche.
2. **Bouton « Effacer les traces »** (F-APP-5) : absent des maquettes ; à placer dans la barre « Afficher ».
3. **Préréglage « Terre – Lune »** : remplacé par « Gros et petit (10 : 1) » (maquette Mode 2 mise à jour).
4. **Dérive du centre de masse en mode 2** : si l'utilisateur fixe des vitesses de somme non nulle, le point de vue « fixe » montre le système dériver. Proposition : bouton « Annuler la dérive » (recale la vitesse totale à 0 au lancement), désactivé par défaut.
5. **Halley** : la vitesse de départ (11,47 UA/an) est proche de la borne haute du curseur (12) et proche de `v_lib` (11,57) ; ajouter une graduation fine ou un zoom du curseur si la précision de saisie est insuffisante.
6. **Vitesse du temps par défaut** : ×1 (les maquettes montrent ×10).
7. **Téléphone** : hors périmètre V1 ; l'application ne doit pas déborder, mais aucune optimisation n'est exigée.
8. **Précisions numériques** : les tolérances de T-02, T-07, T-08 sont à calibrer lors du jalon J1 ; toute modification des valeurs par défaut de `ETA` doit être justifiée par ces tests.
