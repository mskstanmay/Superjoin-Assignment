import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '');
  if (!env.VITE_API_BASE_URL) throw new Error('VITE_API_BASE_URL is required; initialize the root .env first');
  return {
    plugins: [react()], envDir: '..',
    server: { port: 5173, strictPort: true, proxy: {
      '/backend': { target: env.BACKEND_PROXY_TARGET || 'http://127.0.0.1:3000', rewrite: path => path.replace(/^\/backend/, '') },
    } },
  };
});
