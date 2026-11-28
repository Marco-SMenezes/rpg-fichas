import { expect, test, type Page } from '@playwright/test'
import { ligarNuvem } from './nuvem-simulada'

async function criarGuerreiro(page: Page) {
  await ligarNuvem(page, { logado: false })
  await page.goto('#/novo')
  await page.getByLabel('Nome do personagem').fill('Bruna')
  const proximo = () => page.getByRole('button', { name: 'Próximo' }).click()
  await proximo()
  await page.getByRole('radio', { name: /^Humano \+1/ }).check()
  await proximo()
  await page.getByRole('radio', { name: /^Guerreiro/ }).check()
  await page.getByRole('radio', { name: /^Defesa/ }).check()
  await proximo()
  await page.getByRole('radio', { name: /^Soldado/ }).check()
  await page.getByLabel('Um tipo de kit de jogo').selectOption({ label: 'Conjunto de dados' })
  await page.getByLabel('Idioma 1').selectOption({ label: 'Anão' })
  await proximo()
  await proximo()
  await page.getByRole('checkbox', { name: 'Percepção' }).check()
  await page.getByRole('checkbox', { name: 'Sobrevivência' }).check()
  for (let i = 0; i < 3; i++) await proximo()
  await page.getByRole('button', { name: 'Criar personagem' }).click()
  await page.waitForURL(/#\/p\//)
  await page.getByRole('navigation', { name: 'Seções da ficha' }).getByRole('button', { name: 'Habilidades' }).click()
}

test('a evolução é uma trilha de marcos: só níveis com novidade e o atual destacado', async ({ page }) => {
  await criarGuerreiro(page)
  const trilha = page.getByRole('list', { name: 'Evolução por nível' })
  await expect(trilha).toBeVisible()
  const marcos = trilha.getByRole('button')
  // O guerreiro tem novidade em bem menos de 20 níveis.
  expect(await marcos.count()).toBeLessThan(15)
  await expect(trilha.locator('[aria-current="step"]')).toHaveCount(1)
  await expect(trilha.getByText('Você está aqui')).toBeVisible()
  // Escolha de atributo ou talento tem rótulo curto no nó.
  await expect(trilha.getByText('Atributo ou talento').first()).toBeVisible()
})

test('tocar num marco abre o detalhe e tocar de novo fecha', async ({ page }) => {
  await criarGuerreiro(page)
  const trilha = page.getByRole('list', { name: 'Evolução por nível' })
  const surto = trilha.getByRole('button', { name: /Surto de Ação/ })
  await expect(surto).toHaveAttribute('aria-expanded', 'false')
  await surto.click()
  await expect(surto).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('region', { name: 'Nível 2' })).toContainText('Surto de Ação')
  await surto.click()
  await expect(page.getByRole('region', { name: 'Nível 2' })).toHaveCount(0)
})

test('antes de escolher a subclasse, os caminhos possíveis saem do nó do 3º nível', async ({ page }) => {
  await criarGuerreiro(page)
  const trilha = page.getByRole('list', { name: 'Evolução por nível' })
  await expect(trilha.getByRole('list', { name: 'Caminhos possíveis' }).getByRole('listitem')).toHaveText([
    'Campeão',
    'Mestre de Batalha',
    'Cavaleiro Arcano',
  ])
  await expect(page.getByRole('heading', { name: 'Caminhos possíveis' })).toBeVisible()
})

test('não rola para o lado', async ({ page }) => {
  await criarGuerreiro(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
