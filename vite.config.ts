import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// `BASE_PATH` permet un déploiement dans un sous-dossier (ex. GitHub Pages : « /simulation-trajectoire-astre/ »).
// Par défaut, chemins relatifs : le build fonctionne depuis n'importe quel dossier.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [
    react(),
    // Application installable et utilisable hors ligne (§ 8.1, option retenue en J7). Le service
    // worker ne met en cache que les fichiers du site : aucun appel réseau externe (CLAUDE.md, règle 7).
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Trajectoires — simulation de trajectoires d’astres',
        short_name: 'Trajectoires',
        description:
          'Simulateur de trajectoires d’astres pour les enfants : cercle, ellipse, parabole, hyperbole, et deux corps qui s’attirent.',
        lang: 'fr',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#070b17',
        theme_color: '#0d1428',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Polices auto-hébergées comprises (woff et woff2).
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,webmanifest}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/physics/**/*.ts'],
      exclude: ['src/physics/**/*.test.ts'],
      thresholds: { functions: 90 },
    },
  },
});
