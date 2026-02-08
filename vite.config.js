
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'OVERLOAD — Hypertrophy Planner',
        short_name: 'OVERLOAD',
        description: 'OVERLOAD: RP-style hypertrophy planner with Supabase sync, PWA offline logging, and progressive overload guidance.',
        theme_color: '#0b1020',
        background_color: '#0b1020',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({request}) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages' }
          },
          {
            urlPattern: ({url}) => url.origin === self.location.origin,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets' }
          }
        ]
      }
    })
  ]
})
