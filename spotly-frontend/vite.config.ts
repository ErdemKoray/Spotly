import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // dedupe kaldırıldı — Vite 8/Rolldown'da modül çözümleme döngüsüne yol açıyordu
  },

  // Ağır paketleri önceden bundle et → soğuk başlatma donmasını önler
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'framer-motion',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'date-fns',
      'leaflet',
    ],
  },

  server: {
    port: 5173,
    strictPort: false, // port meşgulse bir sonrakine geç
  },
})
