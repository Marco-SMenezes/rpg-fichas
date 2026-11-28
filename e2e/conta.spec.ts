import { expect, test, type Page } from '@playwright/test'
import { ligarNuvem } from './nuvem-simulada'

// No modo "Criar conta" a ajuda fica dentro do rótulo; o name é estável.
const campoSenha = (page: Page) => page.locator('input[name="senha"]')

test.beforeEach(async ({ page }) => {
  await ligarNuvem(page, { logado: false })
  await page.goto('#/campanhas')
})

test('criar conta mostra a regra da senha e aponta o que falta', async ({ page }) => {
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByText('Pelo menos 8 caracteres, com letra maiúscula, minúscula e número.')).toBeVisible()
  await page.getByLabel('Seu nome').fill('Ana')
  await page.getByLabel('E-mail').fill('ana@exemplo.com')

  await campoSenha(page).fill('dragao42')
  await page.getByRole('button', { name: 'Pedir conta' }).click()
  await expect(page.getByRole('alert')).toHaveText('Falta uma letra maiúscula na senha.')

  await campoSenha(page).fill('Dragaozinho')
  await page.getByRole('button', { name: 'Pedir conta' }).click()
  await expect(page.getByRole('alert')).toHaveText('Falta um número na senha.')
})

test('senha boa cria a conta e entra', async ({ page }) => {
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await page.getByLabel('Seu nome').fill('Ana')
  await page.getByLabel('E-mail').fill('ana@exemplo.com')
  await campoSenha(page).fill('Dragao42')
  await page.getByRole('button', { name: 'Pedir conta' }).click()
  await expect(page.getByRole('heading', { name: 'Criar campanha' })).toBeVisible()
})

test('entrar com senha antiga curta não é barrado no site', async ({ page }) => {
  await page.getByLabel('E-mail').fill('ana@exemplo.com')
  await campoSenha(page).fill('abc123')
  await page.locator('form.conta--form').getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Criar campanha' })).toBeVisible()
})

test('o botão do olho mostra e esconde a senha', async ({ page }) => {
  const senha = campoSenha(page)
  await expect(senha).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Mostrar senha' }).click()
  await expect(senha).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Esconder senha' }).click()
  await expect(senha).toHaveAttribute('type', 'password')
})
