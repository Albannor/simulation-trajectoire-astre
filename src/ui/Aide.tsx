import { useEffect, useRef } from 'react';
import { fr } from '../i18n/fr';

interface Props {
  ouverte: boolean;
  onFermer: () => void;
}

/** Aide (F-APP-2) : boîte de dialogue native, fermée par Échap ou par le bouton. */
export function Aide({ ouverte, onFermer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogue = ref.current;
    if (!dialogue) return;
    if (ouverte && !dialogue.open) dialogue.showModal();
    if (!ouverte && dialogue.open) dialogue.close();
  }, [ouverte]);

  return (
    <dialog ref={ref} className="boite-aide" aria-labelledby="titre-aide" onClose={onFermer}>
      <div className="boite-aide__entete">
        <h2 id="titre-aide">{fr.aide.titre}</h2>
        <button type="button" className="bouton-pilule" onClick={onFermer}>
          {fr.aide.fermer}
        </button>
      </div>
      {fr.aide.sections.map((section) => (
        <section key={section.titre} className="boite-aide__section">
          <h3>{section.titre}</h3>
          {section.texte.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </section>
      ))}
    </dialog>
  );
}
