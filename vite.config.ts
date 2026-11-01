import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// `BASE_PATH` permet un déploiement dans un sous-dossier (ex. GitHub Pages : « /simulation-trajectoire-astre/ »).
// Par défaut, chemins relatifs : le build fonctionne depuis n'importe quel dossier.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [react()],
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
