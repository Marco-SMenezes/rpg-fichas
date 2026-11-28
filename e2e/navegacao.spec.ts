import { expect, test } from '@playwright/test'
import { ligarNuvem, vigiarErros } from './nuvem-simulada'

const TELAS = [
  { rota: '#/', titulo: /Personagens/ },
  { rota: '#/novo', titulo: /Nome e conceito/ },
  { rota: '#/campanhas', titulo: /Campanhas/ },
  { rota: '#/dados', titulo: /Dados/ },
  { rota: '#/compendio', titulo: /Compêndio/ },
  { rota: '#/bestiario', titulo: /Bestiário/ },
  { rota: '#/modelos', titulo: /Construtor de fichas/ },
]

for (const { rota, titulo } of TELAS) {
  test(`${rota} abre sem erro e sem rolagem para o lado`, async ({ page }) => {
    const erros = vigiarErros(page)
    await ligarNuvem(page)
    await page.goto(rota)
    await expect(page.locator('h1').first()).toHaveText(titulo)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(erros).toEqual([])
  })
}

test('endereço que não existe mostra a página de não encontrada', async ({ page }) => {
  await ligarNuvem(page)
  await page.goto('#/isso-nao-existe')
  await expect(page.locator('h1').first()).toBeVisible()
  await expect(page.locator('main')).not.toBeEmpty()
})
