import { defineConfig, devices } from '@playwright/test'

// Testes no navegador (npm run e2e). Usam o site já construído e uma nuvem
// simulada (e2e/nuvem-simulada.ts): nada chega ao Supabase de verdade.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/rpg-fichas/',
    trace: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'computador', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/rpg-fichas/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
