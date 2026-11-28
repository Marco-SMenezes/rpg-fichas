import { expect, test, type Page } from '@playwright/test'
import { guardarFichas, guerreiro } from './fichas'
import { ligarNuvem } from './nuvem-simulada'

/** Guerreiro caído (0 PV) com os testes contra a morte já marcados. */
async function abrirCaido(page: Page, morte: { sucessos: number; falhas: number }) {
  const ficha = guerreiro(1)
  ficha.estado = { ...ficha.estado, pvAtual: 0, morte }
  await ligarNuvem(page, { logado: false })
  await guardarFichas(page, [ficha])
  await page.goto(`#/p/${ficha.id}`)
  await page.getByRole('navigation', { name: 'Seções da ficha' }).getByRole('button', { name: 'Geral' }).click()
}

test('o terceiro sucesso marcado devolve 1 PV e some o painel de morte', async ({ page }) => {
  await abrirCaido(page, { sucessos: 2, falhas: 1 })
  const painel = page.getByRole('region', { name: 'Testes contra a morte' })
  await expect(painel).toContainText('Caído com 0 PV')
  await painel.getByRole('button', { name: 'Sucessos: 3' }).click()
  await expect(painel).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Rolar teste contra a morte/ })).toHaveCount(0)
})

test('com dois sucessos ainda está morrendo', async ({ page }) => {
  await abrirCaido(page, { sucessos: 1, falhas: 0 })
  const painel = page.getByRole('region', { name: 'Testes contra a morte' })
  await painel.getByRole('button', { name: 'Sucessos: 2' }).click()
  await expect(painel).toContainText('Caído com 0 PV')
  await expect(painel.getByRole('button', { name: 'Rolar teste contra a morte' })).toBeVisible()
})

test('a explicação diz que o Tomo já devolve 1 PV', async ({ page }) => {
  await abrirCaido(page, { sucessos: 0, falhas: 0 })
  await expect(page.getByRole('region', { name: 'Testes contra a morte' })).toContainText('o Tomo já devolve 1 PV')
})

test.describe('quem está caído não ataca', () => {
  test('com 0 PV os ataques da ficha ficam desativados e a tela explica', async ({ page }) => {
    await abrirCaido(page, { sucessos: 0, falhas: 0 })
    await page.getByRole('navigation', { name: 'Seções da ficha' }).getByRole('button', { name: 'Combate' }).click()
    const ataques = page.locator('button.ataque')
    expect(await ataques.count()).toBeGreaterThan(0)
    for (const botao of await ataques.all()) await expect(botao).toBeDisabled()
    await expect(page.getByRole('status').filter({ hasText: 'não pode atacar' })).toBeVisible()
  })

  test('com PV os ataques funcionam e abrem a janela', async ({ page }) => {
    const ficha = guerreiro(1)
    await ligarNuvem(page, { logado: false })
    await guardarFichas(page, [ficha])
    await page.goto(`#/p/${ficha.id}`)
    await page.getByRole('navigation', { name: 'Seções da ficha' }).getByRole('button', { name: 'Combate' }).click()
    const primeiro = page.locator('button.ataque').first()
    await expect(primeiro).toBeEnabled()
    await expect(page.getByRole('status').filter({ hasText: 'não pode atacar' })).toHaveCount(0)
    await primeiro.click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('curar o caído libera os ataques de novo', async ({ page }) => {
    await abrirCaido(page, { sucessos: 0, falhas: 0 })
    await page.getByRole('region', { name: 'Testes contra a morte' }).getByRole('button', { name: 'Sucessos: 3' }).click()
    await page.getByRole('navigation', { name: 'Seções da ficha' }).getByRole('button', { name: 'Combate' }).click()
    await expect(page.locator('button.ataque').first()).toBeEnabled()
  })
})
