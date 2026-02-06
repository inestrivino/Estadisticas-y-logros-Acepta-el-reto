import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({})],
  publicDir: false, //para que no se copien dos veces por tener dos inputs
  build: {
    outDir: 'dist-front',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        pruebaSocket: '/public/pruebaSocket.html',
        index: '/index.html'
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});