import { expect, test } from '@playwright/test'
import { ligarNuvem, OUTRO, vigiarErros } from './nuvem-simulada'

test.describe('Campanhas', () => {
  test('sem conta, pede para entrar e não mostra o botão de código', async ({ page }) => {
    await ligarNuvem(page, { logado: false })
    await page.goto('#/campanhas')
    await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar com código' })).toHaveCount(0)
  })

  test('conta aguardando aprovação não vê as campanhas', async ({ page }) => {
    await ligarNuvem(page, { aprovado: false })
    await page.goto('#/campanhas')
    await expect(page.getByRole('heading', { name: 'Aguardando aprovação' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Criar campanha' })).toHaveCount(0)
  })

  test('sem campanhas, mostra só o criar e o botão de entrar com código', async ({ page }) => {
    const erros = vigiarErros(page)
    await ligarNuvem(page)
    await page.goto('#/campanhas')
    await expect(page.getByRole('heading', { name: 'Criar campanha' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar com código' })).toBeVisible()
    // O formulário de entrar só aparece na janela.
    await expect(page.getByLabel('Código do mestre')).toHaveCount(0)
    expect(erros).toEqual([])
  })

  test('a imagem é o primeiro campo do criar campanha', async ({ page }) => {
    await ligarNuvem(page)
    await page.goto('#/campanhas')
    const form = page.locator('form', { has: page.getByRole('heading', { name: 'Criar campanha' }) })
    await expect(form).toBeVisible()
    const rotulos = await form.locator('.rotulo').allTextContents()
    expect(rotulos[0]).toMatch(/imagem da campanha/i)
    expect(rotulos[1]).toMatch(/nome/i)
  })

  test('cria uma campanha e abre a página dela', async ({ page }) => {
    const nuvem = await ligarNuvem(page)
    await page.goto('#/campanhas')
    await page.getByLabel('Nome', { exact: true }).fill('Sombras de Phandalin')
    await page.getByLabel('Tema', { exact: true }).fill('Fantasia sombria')
    await page.getByRole('button', { name: 'Criar como mestre' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Sombras de Phandalin' })).toBeVisible()
    await expect(page.getByText('Você é o mestre')).toBeVisible()
    expect(nuvem.tabela('campanhas')).toHaveLength(1)
  })

  test('entrar com código: código errado avisa, certo abre a campanha', async ({ page }) => {
    const nuvem = await ligarNuvem(page, { campanhas: [{ id: 'c-mesa', nome: 'A Mina Perdida', mestre: OUTRO, codigo: 'K7M2QX' }] })
    await page.goto('#/campanhas')
    await page.getByRole('button', { name: 'Entrar com código' }).click()

    const janela = page.getByRole('dialog', { name: 'Entrar com código' })
    await expect(janela).toBeVisible()
    await janela.getByLabel('Código do mestre').fill('abc')
    await janela.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(janela.getByRole('alert')).toHaveText('O código tem 6 letras e números.')

    await janela.getByLabel('Código do mestre').fill('ZZZZZZ')
    await janela.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(janela.getByRole('alert')).toContainText('Código não encontrado')

    await janela.getByLabel('Código do mestre').fill('k7m2qx')
    await janela.getByLabel('Seu nome na mesa').fill('Ana')
    await janela.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'A Mina Perdida' })).toBeVisible()
    await expect(page.getByText('Você é jogador')).toBeVisible()
    expect(nuvem.tabela('membros')).toContainEqual(expect.objectContaining({ campanha_id: 'c-mesa', apelido: 'Ana' }))
  })

  test('a janela fecha com Esc', async ({ page }) => {
    await ligarNuvem(page)
    await page.goto('#/campanhas')
    await page.getByRole('button', { name: 'Entrar com código' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('a seta da campanha fica na mesma linha do nome', async ({ page }) => {
    await ligarNuvem(page, { campanhas: [{ nome: 'A Mina Perdida dos Anões de Phandelver, uma campanha longa' }] })
    await page.goto('#/campanhas')
    const linha = page.locator('.pj').first()
    const nome = await linha.locator('.pj__link').boundingBox()
    const seta = await linha.locator(':scope > svg').boundingBox()
    expect(nome && seta).toBeTruthy()
    // A seta começa depois do link e dentro da mesma faixa vertical.
    expect(seta!.x).toBeGreaterThanOrEqual(nome!.x + nome!.width - 1)
    expect(seta!.y).toBeLessThan(nome!.y + nome!.height)
    // Sem rolagem para o lado.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})

test.describe('Página da campanha', () => {
  test('o mestre vê as abas Escudo e Trilhas; o jogador não', async ({ page }) => {
    await ligarNuvem(page, {
      campanhas: [
        { id: 'c-minha', nome: 'Minha mesa' },
        { id: 'c-dele', nome: 'Mesa do amigo', mestre: OUTRO },
      ],
    })
    await page.goto('#/c/c-minha')
    const abas = page.getByRole('navigation', { name: 'Partes da campanha' })
    await expect(abas.getByRole('link', { name: 'Trilhas' })).toBeVisible()
    await expect(abas.getByRole('link', { name: 'Escudo' })).toBeVisible()

    await page.goto('#/c/c-dele')
    await expect(page.getByRole('heading', { level: 1, name: 'Mesa do amigo' })).toBeVisible()
    await expect(abas.getByRole('link', { name: 'Trilhas' })).toHaveCount(0)
    await expect(abas.getByRole('link', { name: 'Escudo' })).toHaveCount(0)
  })

  test('jogador que abre o endereço das trilhas cai na campanha', async ({ page }) => {
    await ligarNuvem(page, { campanhas: [{ id: 'c-dele', nome: 'Mesa do amigo', mestre: OUTRO }] })
    await page.goto('#/c/c-dele/trilhas')
    await expect(page.getByRole('heading', { level: 1, name: 'Mesa do amigo' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Campanha', exact: true })).toHaveAttribute('aria-current', 'page')
  })

  test('as abas abrem sem erro para o mestre', async ({ page }) => {
    const erros = vigiarErros(page)
    await ligarNuvem(page, { campanhas: [{ id: 'c-minha', nome: 'Minha mesa' }] })
    for (const aba of ['', '/combate', '/escudo', '/trilhas']) {
      await page.goto(`#/c/c-minha${aba}`)
      await expect(page.getByRole('heading', { level: 1, name: 'Minha mesa' })).toBeVisible()
    }
    expect(erros).toEqual([])
  })
})
