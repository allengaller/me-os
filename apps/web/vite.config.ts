import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function cloudEnv(): Record<string, string> {
  const file = path.resolve(__dirname, '../../.env');
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  );
}

const supabaseUrl = cloudEnv().SUPABASE_URL;

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3015,
    strictPort: true,
    host: '0.0.0.0',
    ...(supabaseUrl
      ? {
          proxy: {
            '/sb-api': {
              target: supabaseUrl,
              changeOrigin: true,
              rewrite: (p: string) => p.replace(/^\/sb-api/, ''),
            },
          },
        }
      : {}),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    assetsInlineLimit: 1024 * 1024,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-data': ['axios', 'zustand'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
