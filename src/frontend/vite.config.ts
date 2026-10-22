import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const codespaceHost = process.env.CODESPACE_NAME
  ? `${process.env.CODESPACE_NAME}-5137.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? 'app.github.dev'}`
  : undefined;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5137,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: codespaceHost ? [codespaceHost] : [],
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  define: {
    'process.env.CODESPACE_NAME': JSON.stringify(process.env.CODESPACE_NAME),
  },
});
