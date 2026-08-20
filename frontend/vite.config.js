import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const backendTarget =
    env.VITE_BACKEND_TARGET || 'http://127.0.0.1:4000';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    build: {
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');

            if (normalizedId.includes('/node_modules/')) {
              // 1. Heavy standalone libraries (loaded only on specific routes)
              if (normalizedId.includes('@stream-io') || normalizedId.includes('stream-video') || normalizedId.includes('stream-chat')) {
                return 'vendor-stream';
              }
              if (normalizedId.includes('framer-motion')) {
                return 'vendor-framer';
              }
              if (normalizedId.includes('/swiper/')) {
                return 'vendor-swiper';
              }
              if (normalizedId.includes('/gsap/') || normalizedId.includes('@gsap/')) {
                return 'vendor-gsap';
              }
              if (normalizedId.includes('/three/')) {
                return 'vendor-three';
              }
              if (
                normalizedId.includes('react-markdown') ||
                normalizedId.includes('remark-gfm') ||
                normalizedId.includes('micromark') ||
                normalizedId.includes('/unist') ||
                normalizedId.includes('/mdast')
              ) {
                return 'vendor-markdown';
              }

              // 2. Redux state management
              if (
                normalizedId.includes('@reduxjs/toolkit') ||
                normalizedId.includes('react-redux') ||
                normalizedId.includes('/redux/') ||
                normalizedId.includes('immer') ||
                normalizedId.includes('reselect')
              ) {
                return 'vendor-redux';
              }

              // 3. React core runtime
              if (
                normalizedId.includes('/node_modules/react/') ||
                normalizedId.includes('/node_modules/react-dom/') ||
                normalizedId.includes('/node_modules/scheduler/') ||
                normalizedId.includes('/node_modules/react-router/') ||
                normalizedId.includes('/node_modules/react-router-dom/') ||
                normalizedId.includes('/node_modules/react-helmet-async/') ||
                normalizedId.includes('/node_modules/react-hot-toast/')
              ) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },

    server: {
      port: 5173,
      proxy: {
        '/sitemap.xml': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          rewrite: () => '/api/seo/sitemap.xml',
        },
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