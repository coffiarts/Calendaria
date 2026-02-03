import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptsPath = resolve(__dirname, 'scripts').replace(/\\/g, '/');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: resolve(__dirname),
    include: ['dev/tests/**/*.test.mjs'],
    setupFiles: ['./dev/__mocks__/index.mjs'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      all: true,
      include: [`${scriptsPath}/**/*.mjs`],
      exclude: ['**/dev/**', '**/applications/**', '**/sheets/**', '**/importers/**', '**/integrations/**']
    },
    mockReset: true,
    restoreMocks: true
  }
});
