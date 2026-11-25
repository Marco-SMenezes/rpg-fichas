import { describe, expect, it } from 'vitest'
import type { Personagem } from '../regras/dnd5e/tipos'
import { lerExclusoes, linhaDe, mesclar, type Linha } from './sincronizacao'

const ficha = (id: string, atualizadoEm: string, nome = id): Personagem =>
  ({ id, nome, atualizadoEm, criadoEm: atualizadoEm }) as Personagem

const T1 = '2026-11-01T10:00:00.000Z'
const T2 = '2026-11-02T10:00:00.000Z'
const T3 = '2026-11-03T10:00:00.000Z'

describe('mesclar', () => {
  it('sobe fichas que só existem no aparelho (primeiro login)', () => {
    const r = mesclar([ficha('a', T1), ficha('b', T2)], {}, [])
    expect(r.enviar.map((l) => l.id)).toEqual(['a', 'b'])
    expect(r.locais.map((p) => p.id)).toEqual(['a', 'b'])
    expect(r.alteradosAqui).toEqual([])
  })

  it('baixa fichas que só existem na nuvem, as mais novas primeiro', () => {
    const r = mesclar([ficha('a', T1)], {}, [linhaDe(ficha('b', T2)), linhaDe(ficha('c', T3))])
    expect(r.locais.map((p) => p.id)).toEqual(['c', 'b', 'a'])
    expect(r.enviar.map((l) => l.id)).toEqual(['a'])
  })

  it('a versão mais nova vence, dos dois lados', () => {
    const r = mesclar(
      [ficha('a', T2, 'Aqui'), ficha('b', T1, 'Aqui')],
      {},
      [linhaDe(ficha('a', T1, 'Nuvem')), linhaDe(ficha('b', T3, 'Nuvem'))],
    )
    expect(r.locais.map((p) => p.nome)).toEqual(['Aqui', 'Nuvem'])
    expect(r.enviar.map((l) => l.id)).toEqual(['a'])
    expect(r.alteradosAqui).toEqual(['b'])
  })

  it('empate não muda nada', () => {
    const r = mesclar([ficha('a', T1)], {}, [linhaDe(ficha('a', T1))])
    expect(r.enviar).toEqual([])
    expect(r.alteradosAqui).toEqual([])
  })

  it('exclusão feita aqui sobe como excluída', () => {
    const r = mesclar([], { a: T2 }, [linhaDe(ficha('a', T1))])
    expect(r.enviar).toEqual([{ id: 'a', dados: null, atualizado_em: T2, excluido: true }])
    expect(r.locais).toEqual([])
  })

  it('exclusão de ficha que nunca subiu não vai para a nuvem', () => {
    expect(mesclar([], { a: T2 }, []).enviar).toEqual([])
  })

  it('exclusão vinda da nuvem apaga daqui', () => {
    const r = mesclar([ficha('a', T1), ficha('b', T1)], {}, [{ id: 'a', dados: null, atualizado_em: T2, excluido: true }])
    expect(r.locais.map((p) => p.id)).toEqual(['b'])
    expect(r.alteradosAqui).toEqual(['a'])
  })

  it('edição na nuvem depois da exclusão aqui traz a ficha de volta', () => {
    const r = mesclar([], { a: T1 }, [linhaDe(ficha('a', T2))])
    expect(r.locais.map((p) => p.id)).toEqual(['a'])
    expect(r.enviar).toEqual([])
  })

  it('edição aqui depois da exclusão na nuvem sobe de novo', () => {
    const remota: Linha = { id: 'a', dados: null, atualizado_em: T1, excluido: true }
    const r = mesclar([ficha('a', T2)], {}, [remota])
    expect(r.enviar.map((l) => [l.id, l.excluido])).toEqual([['a', false]])
  })
})

describe('lerExclusoes', () => {
  it('ignora lixo', () => {
    expect(lerExclusoes(null)).toEqual({})
    expect(lerExclusoes('{quebrado')).toEqual({})
    expect(lerExclusoes('[1]')).toEqual({})
    expect(lerExclusoes('{"a":"2026","b":3}')).toEqual({ a: '2026' })
  })
})
