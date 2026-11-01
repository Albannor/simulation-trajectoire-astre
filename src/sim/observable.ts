/** Petit magasin observable hors de React (changements discrets, § 8.3). */
export class Observable {
  private ecouteurs = new Set<() => void>();
  private versionCourante = 0;

  abonner = (ecouteur: () => void): (() => void) => {
    this.ecouteurs.add(ecouteur);
    return () => this.ecouteurs.delete(ecouteur);
  };

  version = (): number => this.versionCourante;

  protected notifier(): void {
    this.versionCourante++;
    this.ecouteurs.forEach((f) => f());
  }
}
