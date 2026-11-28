import { expect, test, type Page } from '@playwright/test'
import { guardarFichas, guerreiro } from './fichas'
import { EU, ligarNuvem, OUTRO, participante, type NuvemSimulada } from './nuvem-simulada'

const AVISO = 'Morto neste combate: só o mestre pode trazer de volta.'

/** Guerreiro morto (0 PV e três falhas). */
function morto() {
  const f = guerreiro(1)
  f.estado = { ...f.estado, pvAtual: 0, morte: { sucessos: 0, falhas: 3 } }
  return f
}

const abrirFicha = async (page: Page, id: string) => {
  await page.goto(`#/p/${id}`)
  await page.getByRole('navigation', { name: 'Seções da ficha' }).getByRole('button', { name: 'Geral' }).click()
}

test.describe('a ficha de quem morreu', () => {
  test('trava enquanto está num combate: só leitura, com aviso', async ({ page }) => {
    const f = morto()
    await ligarNuvem(page, {
      campanhas: [{ id: 'c1', mestre: OUTRO }],
      combates: [{}],
      participantes: [{ personagem_id: f.id, pv: 0, morte_falhas: 3 }],
    })
    await guardarFichas(page, [f])
    await abrirFicha(page, f.id)
    await expect(page.getByRole('status').filter({ hasText: AVISO })).toBeVisible()
    await expect(page.locator('fieldset.somente-leitura')).toBeVisible()
    await expect(page.getByText('Travada', { exact: true })).toBeVisible()
    // Nada para apertar: nem as marcas dos testes, nem o descanso (o botão do topo some; o dos dados de vida fica desativado).
    await expect(page.getByRole('button', { name: 'Falhas: 2' })).toBeDisabled()
    const descansos = await page.getByRole('button', { name: /descansar/i }).all()
    for (const botao of descansos) await expect(botao).toBeDisabled()
  })

  test('destrava quando não há mais combate (acabou ou o mestre a tirou)', async ({ page }) => {
    const f = morto()
    await ligarNuvem(page, { campanhas: [{ id: 'c1', mestre: OUTRO }] })
    await guardarFichas(page, [f])
    await abrirFicha(page, f.id)
    await expect(page.getByRole('region', { name: 'Testes contra a morte' })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: AVISO })).toHaveCount(0)
    await expect(page.locator('fieldset.somente-leitura')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Falhas: 2' })).toBeEnabled()
  })

  test('quem só está morrendo (duas falhas) não é travado', async ({ page }) => {
    const f = guerreiro(1)
    f.estado = { ...f.estado, pvAtual: 0, morte: { sucessos: 0, falhas: 2 } }
    await ligarNuvem(page, { combates: [{}], participantes: [{ personagem_id: f.id, pv: 0, morte_falhas: 2 }] })
    await guardarFichas(page, [f])
    await abrirFicha(page, f.id)
    await expect(page.getByRole('button', { name: 'Falhas: 3' })).toBeEnabled()
    await expect(page.getByRole('status').filter({ hasText: AVISO })).toHaveCount(0)
  })

  test('sem conta o Tomo não sabe de combate e não trava', async ({ page }) => {
    const f = morto()
    await ligarNuvem(page, { logado: false })
    await guardarFichas(page, [f])
    await abrirFicha(page, f.id)
    await expect(page.locator('fieldset.somente-leitura')).toHaveCount(0)
  })
})

test.describe('a linha de quem morreu no combate', () => {
  async function abrirCombate(page: Page, mestre: string, f = morto()): Promise<NuvemSimulada> {
    const nuvem = await ligarNuvem(page, {
      campanhas: [{ id: 'c1', nome: 'Mesa', mestre }],
      combates: [{}],
      participantes: [
        participante({ id: 'bruna', personagem_id: f.id, usuario: mestre === EU ? OUTRO : EU, pv: 0, pv_max: 12, morte_falhas: 3 }),
        participante({ id: 'ana', nome: 'Ana', personagem_id: 'outra', usuario: OUTRO, pv: 9 }),
      ],
    })
    await guardarFichas(page, [f])
    await page.goto('#/c/c1/combate')
    return nuvem
  }

  test('o dono não mexe em mais nada: sem atacar, sem marcas, sem vida, sem condições, sem iniciativa', async ({ page }) => {
    await abrirCombate(page, OUTRO)
    const linha = page.locator('li.combate__linha--morto')
    await expect(linha).toHaveCount(1)
    await expect(linha).toContainText('Só o mestre pode trazer de volta')
    await expect(linha.getByRole('button', { name: /Atacar com/ })).toBeDisabled()
    await expect(linha.getByRole('button', { name: /Falhas de Bruna/ }).first()).toBeDisabled()
    await expect(linha.getByRole('button', { name: /Tirar 1 PV/ })).toHaveCount(0)
    await expect(linha.getByRole('button', { name: /Dar 1 PV/ })).toHaveCount(0)
    await expect(linha.getByRole('button', { name: /Condições de/ })).toHaveCount(0)
    await expect(linha.getByRole('button', { name: /Teste contra a morte/ })).toHaveCount(0)
    await expect(linha.getByRole('button', { name: /Trazer de volta/ })).toHaveCount(0)
  })

  test('quem não morreu continua mexendo normalmente na própria linha', async ({ page }) => {
    const vivo = guerreiro(1)
    await abrirCombate(page, OUTRO, vivo)
    // A linha da Bruna aqui está morta na nuvem, mas a ficha local dela está viva: vale a ficha, que manda na vida.
    await expect(page.locator('li.combate__linha--morto')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Atacar com Bruna/ })).toBeEnabled()
  })

  test('o mestre vê a linha morta e o botão para trazer de volta; apertar pede 1 PV ao aparelho do jogador', async ({ page }) => {
    const nuvem = await abrirCombate(page, EU)
    const linha = page.locator('li.combate__linha--morto')
    await expect(linha).toHaveCount(1)
    const trazer = linha.getByRole('button', { name: 'Trazer de volta' })
    await expect(trazer).toBeEnabled()
    await trazer.click()
    await expect(page.locator('li.combate__linha--morto')).toHaveCount(0)
    expect(nuvem.tabela('ajustes_de_vida')).toContainEqual(expect.objectContaining({ participante_id: 'bruna', delta: 1 }))
    expect(nuvem.tabela('participantes').find((x) => x.id === 'bruna')).toMatchObject({ pv: 1 })
  })

  test('só a linha de quem morreu tem o botão de trazer de volta (a de quem está vivo, não)', async ({ page }) => {
    await abrirCombate(page, EU)
    await expect(page.getByRole('button', { name: 'Trazer de volta' })).toHaveCount(1)
  })
})
