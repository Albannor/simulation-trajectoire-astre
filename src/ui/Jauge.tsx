import { JAUGE_SEGMENTS } from '../config';
import { fr } from '../i18n/fr';
import { type ShapeClass } from '../physics/kepler';

interface Props {
  /** Forme active, ou null pour une trajectoire droite. */
  forme: ShapeClass | null;
  /** Position du repère (fraction 0–1), ou null. */
  position: number | null;
  /** Description accessible (la jauge n'est pas lue segment par segment). */
  description: string;
}

const FORMES: ShapeClass[] = ['cercle', 'ellipse', 'parabole', 'hyperbole'];

/** Jauge à 4 segments avec repère (§ 5.3, F-M1-5). La forme est aussi nommée en toutes lettres. */
export function Jauge({ forme, position, description }: Props) {
  return (
    <div className="jauge" role="img" aria-label={description}>
      <div className="jauge__piste">
        {position !== null && (
          <span className="jauge__repere" style={{ left: `${position * 100}%` }} />
        )}
        {FORMES.map((f) => (
          <span
            key={f}
            className={`jauge__segment jauge__segment--${f}`}
            data-actif={f === forme}
            style={{ flexBasis: `${JAUGE_SEGMENTS[f] * 100}%` }}
          />
        ))}
      </div>
      <div className="jauge__legendes" aria-hidden="true">
        {FORMES.map((f) => (
          <span
            key={f}
            data-actif={f === forme}
            style={{ flexBasis: `${JAUGE_SEGMENTS[f] * 100}%` }}
          >
            {fr.formes[f].charAt(0).toUpperCase() + fr.formes[f].slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
