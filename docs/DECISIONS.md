# Journal des décisions

Décisions prises en cas d'ambiguïté, d'erreur apparente de la spécification ou d'écart avec les maquettes.
La spécification (`docs/SPECIFICATIONS.md`) n'est pas modifiée ; ce journal la complète.

| Réf. | Date | Sujet | Décision | Validée par |
|---|---|---|---|---|
| D-01 | 2026-11-01 | Trajectoire droite (§ 5.3, cas `\|h\| < 1e-6`) | La spécification annonce « l'astre part en ligne droite » dès que ε ≥ 0, y compris à θ = 180° où l'astre plonge sur le Soleil. Classification retenue : mouvement vers le Soleil (`r⃗·v⃗ < 0`) ou `v₀ = 0` → « L'astre tombe droit sur le Soleil » ; vers l'extérieur et ε < 0 → « L'astre monte, s'arrête puis retombe droit sur le Soleil » ; vers l'extérieur et ε ≥ 0 → « L'astre part en ligne droite ». | Commanditaire |
| D-02 | 2026-11-01 | Annonce « ira percuter le Soleil » (§ 5.3, point 3) | Pour une orbite ouverte qui s'éloigne déjà (`r⃗·v⃗ > 0`), le périhélie est passé : pas de collision. Règle retenue : ellipse/cercle → `rp < R_COLLISION` ; parabole/hyperbole → `rp < R_COLLISION` **et** `r⃗·v⃗ < 0`. S'applique à T-14. | Commanditaire |
| D-03 | 2026-11-01 | Indicateur de précision `\|ΔE/E₀\|` (§ 5.7) | Mal défini quand `E₀ ≈ 0` (parabole). L'indicateur affiché utilise `\|ΔE\| / (½v₀² + μ/r₀)` (échelle des termes d'énergie ; en mode 2, mêmes grandeurs relatives). Les tests T-07/T-08 sur ellipses restent exprimés en `\|ΔE/E\|`. | Commanditaire |
| D-04 | 2026-11-01 | Parabole « exacte » ou « presque » (§ 5.3, point 2) | L'égalité stricte e = 1 n'existe pas en virgule flottante : parabole exacte si `\|e − 1\| < E_PARABOLE_EXACTE = 1e-9` (`src/config.ts`), « presque » au-delà, jusqu'à `TOL_PARABOLE`. | Commanditaire |
| D-05 | 2026-11-01 | Préréglage mode 2 « Un visiteur qui passe » | Départ à 6 UA sur la branche d'approche (`ν < 0`, `ν ≈ −112,9°`). | Commanditaire |
| D-06 | 2026-11-01 | Bulle « vitesse de libération » (§ 6.7) | Troisième formulation « c'est tout juste la vitesse de libération » lorsque la trajectoire est classée parabole. | Commanditaire |
| D-07 | 2026-11-01 | Valeurs de la maquette mode 2 et de T-04 | Les conditions de T-11 donnent `a = 3,32 UA`, `T = 3,50 an` (maquette : 3,30 et 3,46) ; T-11 passe dans ses tolérances, l'application affiche les valeurs calculées. L'état arrondi de T-04 (θ = 159° au lieu de 159,2°) donne `e = 1,610`, `rp = 0,915` ; le préréglage, construit par éléments, affiche 1,60 et 0,90. | Commanditaire |
| D-08 | 2026-11-01 | T-15, doublon « −2,31 » | La première occurrence est lue comme le tiret ASCII « -2,31 », la seconde comme le signe U+2212. | Commanditaire |
| D-09 | 2026-11-01 | Maquette tablette | La barre « Afficher » passe à la ligne (aucun défilement horizontal) ; le bouton d'aide « ? » est conservé dans l'en-tête (F-APP-2) ; « Préréglages » ouvre une section du volet. | Commanditaire |
| D-10 | 2026-11-01 | Renvoi erroné § 4.4 | La ligne `ETA` renvoie au § 5.6 ; le pas adaptatif est décrit au § 5.7. Coquille à corriger dans une prochaine version de la spécification. | Commanditaire |
| D-11 | 2026-11-01 | Commit du jalon J0 | J0 ne correspond à aucune exigence `F-…` : message `chore(F-APP): …`. | Commanditaire |
| D-12 | 2026-11-01 | Formatage du signe et de −0 | `Intl.NumberFormat` fr-FR produit « - » (U+002D) selon les moteurs : normalisé en « − » (U+2212). Un négatif arrondi à zéro s'affiche « 0,00 » (pas « −0,00 ») ; implémenté sans `signDisplay: 'negative'` pour rester compatible avec Safari < 15.4 (tablettes anciennes). | Choix technique (J0) |
