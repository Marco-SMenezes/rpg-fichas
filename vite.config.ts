import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages serve o site em /rpg-fichas/; na Vercel, defina BASE_PATH=/ .
const base = process.env.BASE_PATH ?? '/rpg-fichas/'

export default defineConfig({
  base,
  plugins: [react()],
  // A lista com as 361 magias do livro deixa o pacote em ~160 kB comprimido; o aviso padrão é 500 kB sem compressão.
  build: { chunkSizeWarningLimit: 700 },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
