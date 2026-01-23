import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1500, // avoids warnings for large chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['antd', '@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
          'chart-vendor': ['chart.js', 'chartjs-plugin-datalabels', 'react-chartjs-2', 'recharts'],
          'utils-vendor': ['axios', 'dayjs', 'moment', 'qs', 'lodash', 'lodash-es', 'dexie', '@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          'pdf-excel-vendor': ['jspdf', 'jspdf-autotable', 'xlsx', 'html-to-image'],
          'icons-vendor': ['@ant-design/icons', '@heroicons/react', 'lucide-react', 'react-feather', 'react-icons'],
        },
      },
    },
  },
})
