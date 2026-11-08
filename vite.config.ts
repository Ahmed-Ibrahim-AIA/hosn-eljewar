import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'patch-vite-client-ws-send',
        transform(code, id) {
          if (id.includes('vite/dist/client/client.mjs') || id.includes('@vite/client')) {
            return {
              code: code
                .replace(/ws\.send\(JSON\.stringify\(data\)\)/g, 'ws?.send?.(JSON.stringify(data))')
                .replace(/wsTransport\.send\(data\)/g, 'wsTransport?.send?.(data)')
                .replace(/return transport\.send\(data\);/g, 'return transport?.send?.(data);')
                .replace(/setupForwardConsoleHandler\(transport,\s*forwardConsole\);/g, '/* forwardConsole disabled when HMR disabled */'),
              map: null,
            };
          }
          return null;
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        useCredentials: true,
        includeAssets: [
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-192x192.png',
          'pwa-maskable-512x512.png',
          'apple-touch-icon.png',
          'manifest.json',
        ],
        manifest: {
          id: '/',
          start_url: '/',
          scope: '/',
          name: 'حسن الجوار - إدارة العمارة والمصروفات السكنية',
          short_name: 'حسن الجوار',
          description: 'تطبيق حسن الجوار المتكامل لتسجيل النقود والمصروفات ومتابعة شقق وسكان العمارة وإصدار الإيصالات والتقارير بدون إنترنت',
          theme_color: '#0f766e',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'any',
          dir: 'rtl',
          lang: 'ar',
          prefer_related_applications: false,
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          navigateFallbackDenylist: [/\.apk/i, /borj-elnoor-standalone\.apk/i],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
