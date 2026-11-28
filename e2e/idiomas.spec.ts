import { expect, test, type Locator, type Page } from '@playwright/test'
import { ligarNuvem } from './nuvem-simulada'

// Nome exato: "Comum" não pode casar com "Subcomum".
const opcao = (lista: Locator, nome: string) => lista.locator('option', { hasText: new RegExp(`^${nome}$`) })

async function irParaRaca(page: Page) {
  await ligarNuvem(page, { logado: false })
  await page.goto('#/novo')
  await page.getByLabel('Nome do personagem').fill('Teste')
  await page.getByRole('button', { name: 'Próximo' }).click()
}

test('Domínio do Conhecimento não oferece idioma que o clérigo já fala nem o da outra lista', async ({ page }) => {
  await irParaRaca(page)
  await page.getByRole('radio', { name: /^Humano \+1/ }).check()
  await page.getByRole('button', { name: 'Próximo' }).click()
  await page.getByRole('radio', { name: /^Clérigo/ }).check()
  await page.getByRole('radio', { name: /^Domínio do Conhecimento/ }).check()

  const idioma1 = page.getByLabel(/Bênçãos do Conhecimento: idioma 1/)
  const idioma2 = page.getByLabel(/Bênçãos do Conhecimento: idioma 2/)
  await expect(idioma1).toBeVisible()
  await expect(idioma2).toBeVisible()
  await expect(opcao(idioma1, 'Comum')).toHaveCount(0)
  await expect(opcao(idioma1, 'Subcomum')).toHaveCount(1)

  await idioma1.selectOption({ label: 'Élfico' })
  await expect(idioma1).toHaveValue('Élfico')
  await expect(opcao(idioma2, 'Élfico')).toHaveCount(0)
  await expect(opcao(idioma2, 'Comum')).toHaveCount(0)
})

test('o talento Poliglota do humano variante não oferece Comum', async ({ page }) => {
  await irParaRaca(page)
  await page.getByRole('radio', { name: /^Humano \(variante\)/ }).check()
  const grupo = page.getByRole('group', { name: 'Talento do humano variante' })
  await grupo.getByLabel(/^Talento/).selectOption('poliglota')
  // O nome do campo inclui a opção marcada ("Idioma 1 Escolha…"), por isso o começo do nome.
  const idioma1 = grupo.getByLabel(/^Idioma 1/)
  await expect(idioma1).toBeVisible()
  await expect(opcao(idioma1, 'Comum')).toHaveCount(0)
  await expect(opcao(idioma1, 'Anão')).toHaveCount(1)
})
