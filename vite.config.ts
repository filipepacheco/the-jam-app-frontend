import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {visualizer} from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    cssMinify: 'lightningcss',
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React runtime - changes rarely, caches well
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/'))
              return 'vendor-react'
            // Auth + API layer
            if (id.includes('@supabase') || id.includes('axios') || id.includes('/swr/'))
              return 'vendor-api'
            // UI libraries
            if (id.includes('framer-motion') || id.includes('lucide-react'))
              return 'vendor-ui'
            // i18n
            if (id.includes('i18next'))
              return 'vendor-i18n'
          }
        },
      },
    },
  },
})
