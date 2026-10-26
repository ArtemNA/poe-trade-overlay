import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  resolve: {
    // Same aliases as tsconfig.json `paths`.
    alias: {
      '@/assets/data': src('lib/apt/data'),
      '@/parser': src('lib/apt/parser'),
      '@/web/Config': src('app/apt-shims/web-config'),
      '@/web/overlay/interfaces': src('app/apt-shims/overlay-interfaces'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
