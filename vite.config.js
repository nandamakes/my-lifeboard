import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png'],
      manifest: '/manifest.webmanifest',
      workbox: {
        // cache static assets; let Supabase calls pass online
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
