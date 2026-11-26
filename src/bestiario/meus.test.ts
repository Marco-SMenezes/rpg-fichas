import { describe, expect, it } from 'vitest'
import { normalizarMonstro } from '../regras/dnd5e/dados/monstros/busca'
import type { Monstro } from '../regras/dnd5e/dados/monstros/tipos'
import { exportarMonstros, importarMonstros, listarMeusMonstros, meusMonstros } from './meus'

const goblin = normalizarMonstro(
  {
    id: 'srd-goblin',
    nome: 'Goblin',
    nomeOriginal: 'Goblin',
    nd: '1/4',
    acoes: [{ nome: 'Cimitarra', texto: '+4 para acertar' }],
  },
  'srd',
) as Monstro

describe('meus monstros', () => {
  it('copiar do SRD cria um monstro meu', () => {
    const c = meusMonstros.copiar(goblin)
    expect(c.id).not.toBe(goblin.id)
    expect(c.id.startsWith('monstro-')).toBe(true)
    expect(c.origem).toBe('meu')
    expect(c.nome).toBe('Goblin (cópia)')
    expect(listarMeusMonstros().some((m) => m.id === c.id)).toBe(true)
  })

  it('arquivo de outro formato ou inválido não grava nada', () => {
    const antes = listarMeusMonstros().length
    expect(importarMonstros('{"formato":"tomo-modelo"}').ok).toBe(false)
    expect(importarMonstros('x').ok).toBe(false)
    expect(listarMeusMonstros()).toHaveLength(antes)
  })

  it('exportar e importar mantém as ações e dá ids novos', () => {
    const antes = listarMeusMonstros().length
    const texto = exportarMonstros([goblin, { ...goblin, id: 'srd-x', nome: 'Outro' }])
    const r = importarMonstros(texto)
    expect(r).toEqual({ ok: true, quantos: 2 })
    const novos = listarMeusMonstros().slice(0, 2)
    expect(listarMeusMonstros()).toHaveLength(antes + 2)
    expect(novos.every((m) => m.id.startsWith('monstro-') && m.origem === 'meu')).toBe(true)
    expect(novos.find((m) => m.nome === 'Goblin')?.acoes[0]?.nome).toBe('Cimitarra')
  })

  it('monstro de versão antiga (sem ações bônus) é lido com padrões', () => {
    const { acoesBonus: _, ...velho } = goblin
    expect(normalizarMonstro(velho, 'meu')?.acoesBonus).toEqual([])
  })

  it('excluir tira da lista', () => {
    const m = meusMonstros.novo()
    expect(m.nome).toBe('Novo monstro')
    meusMonstros.excluir(m.id)
    expect(listarMeusMonstros().some((x) => x.id === m.id)).toBe(false)
  })
})
