import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages serve o site em /rpg-fichas/; na Vercel, defina BASE_PATH=/ .
const base = process.env.BASE_PATH ?? '/rpg-fichas/'

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
