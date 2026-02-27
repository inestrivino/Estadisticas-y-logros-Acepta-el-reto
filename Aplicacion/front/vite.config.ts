import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({})],
  build: {
    outDir: 'dist-front'
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': 'http://back:3000',
      '/socket.io': {
        target: 'http://back:8080',
        ws: true,        
        changeOrigin: true,
      }
    },
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"]
  },
});