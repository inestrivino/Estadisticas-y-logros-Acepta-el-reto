import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({})],
  build: {
    outDir: 'dist-front',
    /*assetsDir: 'assets',
    rollupOptions: {
      input: {
        pruebaSocket: '/public/pruebaSocket.html',
        index: '/index.html'
      },
    },*/
  },
  server: {
    host: true, // o '0.0.0.0'
    port: 5173,
    watch: {
      usePolling: true, // para volúmenes de Docker
    },
    proxy: {
      '/api': 'http://back:3000',
    },
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"]
  },
});