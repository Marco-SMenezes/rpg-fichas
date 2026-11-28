import { expect, test, type Page } from '@playwright/test'
import { ligarNuvem, vigiarErros } from './nuvem-simulada'

const proximo = (page: Page) => page.getByRole('button', { name: 'Próximo' }).click()
const titulo = (page: Page) => page.locator('h1')

test.beforeEach(async ({ page }) => {
  await ligarNuvem(page, { logado: false })
})

test('a foto é o primeiro campo do passo Nome', async ({ page }) => {
  await page.goto('#/novo')
  const rotulos = await page.locator('form.criacao__corpo .rotulo').allTextContents()
  expect(rotulos[0]).toMatch(/foto do personagem/i)
  expect(rotulos[1]).toMatch(/nome do personagem/i)
})

test('não avança sem escolher o que falta', async ({ page }) => {
  await page.goto('#/novo')
  await page.getByLabel('Nome do personagem').fill('Bruna')
  await proximo(page)
  await proximo(page)
  await page.getByRole('radio', { name: /^Guerreiro/ }).check()
  await proximo(page)
  await expect(page.getByRole('alert').filter({ hasText: 'Estilo de Luta' })).toBeVisible()
  await expect(titulo(page)).toHaveText('Classe')
})

test('cria um humano guerreiro do começo ao fim e abre a ficha', async ({ page }) => {
  const erros = vigiarErros(page)
  await page.goto('#/novo')

  await page.getByLabel('Nome do personagem').fill('Bruna Pedraforte')
  await page.getByLabel('Conceito').fill('Ex-soldado que virou guarda de caravana')
  await proximo(page)

  await expect(titulo(page)).toHaveText('Raça')
  await page.getByRole('radio', { name: /^Humano \+1/ }).check()
  await proximo(page)

  await expect(titulo(page)).toHaveText('Classe')
  await page.getByRole('radio', { name: /^Guerreiro/ }).check()
  await page.getByRole('radio', { name: /^Defesa/ }).check()
  await proximo(page)

  await expect(titulo(page)).toHaveText('Antecedente')
  await page.getByRole('radio', { name: /^Soldado/ }).check()
  await page.getByLabel('Um tipo de kit de jogo').selectOption({ label: 'Conjunto de dados' })
  // Comum o humano já fala: nem aparece na lista.
  await expect(page.getByLabel('Idioma 1').locator('option', { hasText: /^Comum$/ })).toHaveCount(0)
  await page.getByLabel('Idioma 1').selectOption({ label: 'Anão' })
  await proximo(page)

  await expect(titulo(page)).toHaveText('Atributos')
  await proximo(page)

  await expect(titulo(page)).toHaveText('Perícias')
  await page.getByRole('checkbox', { name: 'Percepção' }).check()
  await page.getByRole('checkbox', { name: 'Sobrevivência' }).check()
  await proximo(page)

  // Guerreiro no 1º nível não conjura nem tem escolhas de nível.
  for (const passo of ['Equipamento', 'História']) {
    await expect(titulo(page)).toHaveText(passo)
    await proximo(page)
  }

  await expect(titulo(page)).toHaveText('Revisão')
  await page.getByRole('button', { name: 'Criar personagem' }).click()

  await expect(page).toHaveURL(/#\/p\//)
  await expect(page.getByText('Bruna Pedraforte').first()).toBeVisible()
  await expect(page.getByText(/Guerreiro/).first()).toBeVisible()
  const salvos = await page.evaluate(() => JSON.parse(localStorage.getItem('tomo:personagens:v1') ?? '[]'))
  expect(salvos).toHaveLength(1)
  expect(salvos[0].nome).toBe('Bruna Pedraforte')
  expect(erros).toEqual([])

  // A ficha nova aparece na lista de personagens.
  await page.goto('#/')
  await expect(page.getByText('Bruna Pedraforte')).toBeVisible()
})
