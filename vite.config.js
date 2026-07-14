import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/react-router-dom|\/react\/|\/react-dom\//.test(id)) return 'react-vendor'
            if (id.includes('@supabase/supabase-js')) return 'supabase'
            if (id.includes('@tanstack/react-query')) return 'query'
            if (id.includes('@dnd-kit')) return 'dnd'
            if (id.includes('zustand')) return 'zustand'
          }
        },
      },
    },
  },
})
