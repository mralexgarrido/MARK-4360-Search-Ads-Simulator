import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      base: '/MARK-4360-Search-Ads-Simulator/',
      build: {
        outDir: 'docs',
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
