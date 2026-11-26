import { describe, expect, it } from 'vitest'
import { blocosDoCartao, cartoesPadrao, moverCartao, normalizarCartoes, novoCartao } from './cartoes'

describe('cartões padrão', () => {
  it('D&D 5e tem os sete cartões, nesta ordem', () => {
    expect(cartoesPadrao('dnd5e').map((c) => c.id)).toEqual([
      'padrao-cds',
      'padrao-pericias',
      'padrao-armas',
      'padrao-armaduras',
      'padrao-condicoes',
      'padrao-cobertura',
      'padrao-descanso',
    ])
    expect(cartoesPadrao('personalizada')).toEqual([])
  })
  it('armas saem dos dados do Tomo', () => {
    const armas = cartoesPadrao('dnd5e').find((c) => c.id === 'padrao-armas')!
    expect(armas.texto.split('\n')[0]).toBe('Arma | Dano | Propriedades')
    expect(armas.texto).toMatch(/^Adaga \| 1d4 perfurante \| /m)
  })
  it('perícias dizem o atributo e para que servem', () => {
    const p = cartoesPadrao('dnd5e').find((c) => c.id === 'padrao-pericias')!
    expect(p.texto).toMatch(/^Furtividade \| Des \| .+/m)
    expect(p.texto.split('\n').filter((l) => l.includes(' | '))).toHaveLength(19)
  })
})

describe('normalizar', () => {
  it('nunca salvo → padrões; apagou tudo → vazio; lixo → padrões', () => {
    expect(normalizarCartoes(null, 'dnd5e')).toHaveLength(7)
    expect(normalizarCartoes([], 'dnd5e')).toEqual([])
    expect(normalizarCartoes('x', 'dnd5e')).toHaveLength(7)
    expect(normalizarCartoes([{ id: 'a', titulo: 'T' }, { lixo: 1 }], 'dnd5e')).toEqual([{ id: 'a', titulo: 'T', texto: '', oculto: false }])
  })
})

describe('blocos do cartão', () => {
  it('linhas com " | " viram tabela; completa células que faltam', () => {
    expect(blocosDoCartao('a | b\nc | d | e\n\ntexto')).toEqual([
      { tipo: 'tabela', cabecalho: ['a', 'b', ''], linhas: [['c', 'd', 'e']] },
      { tipo: 'paragrafo', texto: 'texto' },
    ])
    expect(blocosDoCartao('')).toEqual([])
    expect(blocosDoCartao(' | ')).toEqual([{ tipo: 'tabela', cabecalho: ['', ''], linhas: [] }])
  })
})

describe('ordem', () => {
  it('sobe e desce sem sair das pontas', () => {
    const l = [novoCartao(), novoCartao(), novoCartao()].map((c, i) => ({ ...c, id: String(i) }))
    expect(moverCartao(l, '1', -1).map((c) => c.id)).toEqual(['1', '0', '2'])
    expect(moverCartao(l, '1', 1).map((c) => c.id)).toEqual(['0', '2', '1'])
    expect(moverCartao(l, '0', -1).map((c) => c.id)).toEqual(['0', '1', '2'])
    expect(moverCartao(l, '2', 1).map((c) => c.id)).toEqual(['0', '1', '2'])
  })
})
