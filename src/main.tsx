import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './fonts';
import './styles/theme.css';
import './styles/app.css';
import { App } from './App';
import { fr } from './i18n/fr';

// Titre de la page depuis fr.ts (tous les textes y sont réunis, CLAUDE.md règle 6).
document.title = fr.app.titreDocument;

const racine = document.getElementById('racine');
if (!racine) throw new Error('Élément #racine introuvable');

createRoot(racine).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
