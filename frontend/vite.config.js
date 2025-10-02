import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '5173-idbm1i7cchm1mbyv4q6du-c9913b96.manusvm.computer',
      '5173-i9yoclayp81wq2wsx8hj6-10592965.manusvm.computer',
      '5173-ik98phtlzj94bradvbsef-8eca33bc.manusvm.computer',
      '5173-ihvikeyqwghz2e5df3p2l-7335cc51.manusvm.computer'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
