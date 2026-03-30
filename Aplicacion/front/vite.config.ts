import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react({})],
  build: {
    outDir: 'dist-front',
    minify: 'esbuild',
    sourcemap: false,
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': process.env.BACKEND_URL || 'http://localhost:3000',
      '/socket.io': {
        target: process.env.SOCKETS_URL || 'http://localhost:8080',
        ws: true,        
        changeOrigin: true,
      }
    },
  },
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"]
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  }
});