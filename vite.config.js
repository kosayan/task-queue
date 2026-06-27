import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/task-queue/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3}'],
        runtimeCaching: []
      },
      manifest: {
        name: 'TASK QUEUE',
        short_name: 'TASK QUEUE',
        start_url: '/task-queue/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: '/task-queue/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/task-queue/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
