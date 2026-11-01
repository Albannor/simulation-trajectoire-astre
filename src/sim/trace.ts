/**
 * Trace d'un corps : tampon circulaire de positions (UA) en Float32Array (§ 8.3).
 * Un point n'est ajouté que s'il est à au moins `seuil` (UA) du précédent.
 */
export class Trace {
  readonly capacite: number;
  private readonly xy: Float32Array;
  private debut = 0;
  private nombre = 0;
  private dernierX = Number.NaN;
  private dernierY = Number.NaN;

  constructor(capacite: number) {
    this.capacite = capacite;
    this.xy = new Float32Array(2 * capacite);
  }

  get longueur(): number {
    return this.nombre;
  }

  vider(): void {
    this.debut = 0;
    this.nombre = 0;
    this.dernierX = Number.NaN;
    this.dernierY = Number.NaN;
  }

  /** Ajoute (x, y) sans condition ; écrase le plus ancien point si le tampon est plein. */
  ajouter(x: number, y: number): void {
    const i = (this.debut + this.nombre) % this.capacite;
    this.xy[2 * i] = x;
    this.xy[2 * i + 1] = y;
    if (this.nombre < this.capacite) this.nombre++;
    else this.debut = (this.debut + 1) % this.capacite;
    this.dernierX = x;
    this.dernierY = y;
  }

  /** Ajoute (x, y) si le point est à au moins `seuil` du précédent. Renvoie vrai si ajouté. */
  ajouterSiEloigne(x: number, y: number, seuil: number): boolean {
    if (this.nombre > 0 && Math.hypot(x - this.dernierX, y - this.dernierY) < seuil) return false;
    this.ajouter(x, y);
    return true;
  }

  /** Parcourt les points du plus ancien au plus récent. */
  parcourir(f: (x: number, y: number, rang: number) => void): void {
    for (let k = 0; k < this.nombre; k++) {
      const i = (this.debut + k) % this.capacite;
      // Indices bornés par la capacité : jamais undefined.
      f(this.xy[2 * i] ?? 0, this.xy[2 * i + 1] ?? 0, k);
    }
  }
}
