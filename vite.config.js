import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/test-1/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'assets/*.png', 'assets/*.mp3'],
      manifest: {
        name: 'SNES Shooter',
        short_name: 'Shooter',
        description: 'A retro style shoot em up game',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'fullscreen',
        orientation: 'portrait',
        icons: [
          {
            src: 'assets/player.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'assets/player.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
