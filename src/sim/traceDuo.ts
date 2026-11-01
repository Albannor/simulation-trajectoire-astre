/**
 * Trace du mode 2 : positions de A et de B relevées aux mêmes instants (tampon circulaire
 * Float32Array, § 8.3). Les enregistrer ensemble permet de dessiner les traces dans n'importe
 * quel point de vue (§ 5.6) : chaque point est ramené à l'origine du même instant.
 */
export class TraceDuo {
  readonly capacite: number;
  /**
   * Masses (mA, mB) pendant l'enregistrement : l'origine d'un point de vue (ex. centre de masse)
   * se calcule avec les masses de l'époque, pas avec les réglages actuels.
   */
  masses: readonly [number, number] = [1, 1];
  private readonly donnees: Float32Array;
  private debut = 0;
  private nombre = 0;
  private dernier: [number, number, number, number] = [Number.NaN, 0, 0, 0];

  constructor(capacite: number) {
    this.capacite = capacite;
    this.donnees = new Float32Array(4 * capacite);
  }

  get longueur(): number {
    return this.nombre;
  }

  vider(): void {
    this.debut = 0;
    this.nombre = 0;
    this.dernier = [Number.NaN, 0, 0, 0];
  }

  ajouter(xA: number, yA: number, xB: number, yB: number): void {
    const i = 4 * ((this.debut + this.nombre) % this.capacite);
    this.donnees[i] = xA;
    this.donnees[i + 1] = yA;
    this.donnees[i + 2] = xB;
    this.donnees[i + 3] = yB;
    if (this.nombre < this.capacite) this.nombre++;
    else this.debut = (this.debut + 1) % this.capacite;
    this.dernier = [xA, yA, xB, yB];
  }

  /** Ajoute si A ou B s'est déplacé d'au moins `seuil` (UA) depuis le point précédent. */
  ajouterSiEloigne(xA: number, yA: number, xB: number, yB: number, seuil: number): boolean {
    const [pxA, pyA, pxB, pyB] = this.dernier;
    if (
      this.nombre > 0 &&
      Math.hypot(xA - pxA, yA - pyA) < seuil &&
      Math.hypot(xB - pxB, yB - pyB) < seuil
    ) {
      return false;
    }
    this.ajouter(xA, yA, xB, yB);
    return true;
  }

  /** Parcourt les relevés du plus ancien au plus récent. */
  parcourir(f: (xA: number, yA: number, xB: number, yB: number, rang: number) => void): void {
    for (let k = 0; k < this.nombre; k++) {
      const i = 4 * ((this.debut + k) % this.capacite);
      // Indices bornés par la capacité : jamais undefined.
      const d = this.donnees;
      f(d[i] ?? 0, d[i + 1] ?? 0, d[i + 2] ?? 0, d[i + 3] ?? 0, k);
    }
  }
}
