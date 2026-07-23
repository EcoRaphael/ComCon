import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Auto-injects the service worker registration — no manual code needed anywhere else
      injectRegister: 'auto',

      // Reuses the icon files already generated for the favicon set — no new images needed
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],

      manifest: {
        name: 'CommuterConnect',
        short_name: 'CommuterConnect',
        description: "Book a ride or drive for Calbayog City's tricycle, timbol, and multicab network.",
        start_url: '/',
        display: 'standalone',
        background_color: '#123A2B',
        theme_color: '#123A2B',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        // Cache the app shell (HTML/JS/CSS) so the app opens instantly on repeat visits,
        // and shows something instead of a blank white screen with no signal.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Never cache Supabase API calls — booking/auth data must always be fresh, live data.
        // Caching these would risk showing stale bookings or an expired session.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3001,
    open: true,
    allowedHosts: ['.ngrok-free.dev'],
  },
})