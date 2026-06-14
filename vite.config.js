import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.VITE_PORT || 5173),
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) return 'react'
          if (id.includes('recharts')) return 'charts'
          if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('@headlessui/react')) return 'ui'
          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('/yup/')) return 'forms'
          return 'vendor'
        },
      },
    },
  },
})
