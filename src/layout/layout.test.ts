import { describe, expect, it } from 'vitest'
import { alternarOculto, definirTodosOcultos, layoutPadrao, moverPara, moverParaSecao, normalizarPersonalizada, moverUmPasso, mudarLargura, normalizarLayout, type DefinicaoBloco } from './layout'

const blocos: DefinicaoBloco[] = [
  { id: 'pv', largura: { estreita: 6, larga: 4 }, secao: 'geral' },
  { id: 'ca', largura: { estreita: 2, larga: 2 }, secao: 'geral' },
  { id: 'pericias', largura: { estreita: 6, larga: 6 }, secao: 'geral' },
  { id: 'notas', largura: { estreita: 6, larga: 12 }, secao: 'historia' },
]
const ids = (l: { id: string }[]) => l.map((x) => x.id)

describe('layout da ficha', () => {
  it('padrão segue a ordem e a largura de cada tela', () => {
    expect(layoutPadrao(blocos, 'larga').map((x) => x.largura)).toEqual([4, 2, 6, 12])
    expect(layoutPadrao(blocos, 'estreita')[1]).toEqual({ id: 'ca', largura: 2, oculto: false, secao: 'geral' })
  })

  it('arrastar move o bloco para a posição do alvo', () => {
    const l = layoutPadrao(blocos, 'larga')
    expect(ids(moverPara(l, 'notas', 'pv'))).toEqual(['notas', 'pv', 'ca', 'pericias'])
    expect(ids(moverPara(l, 'pv', 'pericias'))).toEqual(['ca', 'pericias', 'pv', 'notas'])
  })

  it('mover um passo pula blocos ocultos e para nas pontas', () => {
    let l = alternarOculto(layoutPadrao(blocos, 'larga'), 'ca')
    l = moverUmPasso(l, 'pericias', -1)
    expect(ids(l)).toEqual(['pericias', 'pv', 'ca', 'notas'])
    expect(moverUmPasso(l, 'pericias', -1)).toBe(l)
  })

  it('largura só aceita as opções da tela', () => {
    const l = layoutPadrao(blocos, 'estreita')
    expect(mudarLargura(l, 'pv', 3, 'estreita')[0]!.largura).toBe(3)
    expect(mudarLargura(l, 'pv', 5, 'estreita')[0]!.largura).toBe(6)
  })

  it('normalizar descarta blocos que sumiram e encaixa os novos logo depois do bloco que os precede no padrão', () => {
    const salvo = [
      { id: 'pericias', largura: 4, oculto: true },
      { id: 'antigo', largura: 6, oculto: false },
      { id: 'pv', largura: 6, oculto: false },
    ]
    const l = normalizarLayout(salvo, blocos, 'larga')
    // ca vem depois de pv no padrão; notas vem depois de perícias.
    expect(ids(l)).toEqual(['pericias', 'notas', 'pv', 'ca'])
    expect(l[0]).toEqual({ id: 'pericias', largura: 4, oculto: true, secao: 'geral' })
  })

  it('normalizar aguenta lixo e repetidos', () => {
    expect(ids(normalizarLayout('x', blocos, 'larga'))).toEqual(['pv', 'ca', 'pericias', 'notas'])
    const l = normalizarLayout([{ id: 'ca' }, { id: 'ca' }, null], blocos, 'larga')
    expect(ids(l)).toEqual(['pv', 'ca', 'pericias', 'notas'])
    expect(l.filter((x) => x.id === 'ca')).toHaveLength(1)
  })
})

describe('abas da ficha', () => {
  it('layout antigo, sem seção, vai para a aba padrão de cada bloco', () => {
    const l = normalizarLayout([{ id: 'notas', largura: 6, oculto: false }, { id: 'pv', largura: 6, oculto: false }], blocos, 'larga', ['geral', 'historia'])
    expect(l.find((x) => x.id === 'notas')?.secao).toBe('historia')
    expect(l.find((x) => x.id === 'pv')?.secao).toBe('geral')
  })

  it('seção que não existe mais volta para a padrão', () => {
    const l = normalizarLayout([{ id: 'pv', largura: 4, oculto: false, secao: 'sumiu' }], blocos, 'larga', ['geral', 'historia'])
    expect(l.find((x) => x.id === 'pv')?.secao).toBe('geral')
  })

  it('mover para outra aba leva o bloco para o fim dela', () => {
    const l = moverParaSecao(layoutPadrao(blocos, 'larga'), 'ca', 'historia')
    expect(l.filter((x) => x.secao === 'historia').map((x) => x.id)).toEqual(['notas', 'ca'])
    expect(l.filter((x) => x.secao === 'geral').map((x) => x.id)).toEqual(['pv', 'pericias'])
  })

  it('mover um passo fica dentro da mesma aba', () => {
    const l = moverUmPasso(layoutPadrao(blocos, 'larga'), 'pericias', 1)
    expect(ids(l)).toEqual(['pv', 'ca', 'pericias', 'notas'])
  })
})

describe('aba Personalizada', () => {
  it('sem nada salvo, mostra só os blocos padrão', () => {
    const l = normalizarPersonalizada(undefined, blocos, 'larga', ['pv', 'notas'])
    expect(l.filter((x) => !x.oculto).map((x) => x.id)).toEqual(['pv', 'notas'])
    expect(l.every((x) => x.secao === 'personalizada')).toBe(true)
  })

  it('respeita o que foi escolhido e esconde blocos novos', () => {
    const salvo = [
      { id: 'ca', largura: 2, oculto: false },
      { id: 'pv', largura: 4, oculto: true },
    ]
    const l = normalizarPersonalizada(salvo, blocos, 'larga', ['pv'])
    expect(l.filter((x) => !x.oculto).map((x) => x.id)).toEqual(['ca'])
    expect(l.find((x) => x.id === 'notas')?.oculto).toBe(true)
  })

  it('mostrar ou esconder tudo', () => {
    const l = normalizarPersonalizada(undefined, blocos, 'larga', [])
    expect(definirTodosOcultos(l, false).every((x) => !x.oculto)).toBe(true)
  })
})
