import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
});
