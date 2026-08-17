import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_TARGET || 'http://127.0.0.1:4000';

  return {
    plugins: [react(), tailwindcss()],
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
                return 'vendor-react';
              }
              if (id.includes('@reduxjs') || id.includes('react-redux')) {
                return 'vendor-redux';
              }
              if (id.includes('@stream-io')) {
                return 'vendor-stream';
              }
              if (id.includes('three')) {
                return 'vendor-three';
              }
              if (id.includes('framer-motion') || id.includes('gsap') || id.includes('@gsap')) {
                return 'vendor-animation';
              }
              if (id.includes('swiper')) {
                return 'vendor-swiper';
              }
              if (id.includes('lucide-react') || id.includes('@animateicons')) {
                return 'vendor-icons';
              }
              if (id.includes('react-markdown') || id.includes('remark-gfm')) {
                return 'vendor-markdown';
              }
            }
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
