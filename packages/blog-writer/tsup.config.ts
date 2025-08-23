
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    external: ['react', 'svelte', 'vue', 'ai'],
    dts: true,
    sourcemap: true,
  },
]);
