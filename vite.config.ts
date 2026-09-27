/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Bibliotecas em chunks nomeados e estáveis (cache do navegador sobrevive a deploys do app)
        codeSplitting: {
          groups: [
            { name: 'vendor-supabase', test: /node_modules[/\\]@supabase/ },
            { name: 'vendor-react', test: /node_modules[/\\](react|react-dom|react-router|scheduler)[/\\]/ },
            {
              name: 'vendor-libs',
              test: /node_modules[/\\](@tanstack|react-hook-form|@hookform|zod|lucide-react|qrcode\.react|tailwind-merge)[/\\]/,
            },
          ],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
