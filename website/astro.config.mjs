import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://abbarnabil.github.io',
  base: '/agentic-sdlc-workshop',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { format: 'directory' },
  vite: {
    build: { chunkSizeWarningLimit: 900 },
  },
});
