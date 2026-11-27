import { describe, expect, it } from 'vitest'
import type { Monstro } from '../regras/dnd5e/dados/monstros/tipos'
import { ataquesDoMonstro, resultadoDoAtaque } from './ataques'

const m = (acoes: { nome: string; texto: string }[]) => ({ acoes, acoesBonus: [] }) as unknown as Monstro

describe('ataques do monstro', () => {
  it('lê acerto, dano e tipo', () => {
    const [a] = ataquesDoMonstro(
      m([
        { nome: 'Cimitarra', texto: 'Ataque Corpo a Corpo com Arma: +4 para acertar, alcance 1,5 m, um alvo. Acerto: 5 (1d6 + 2) de dano cortante.' },
      ]),
    )
    expect(a).toEqual({ nome: 'Cimitarra', bonus: 4, dano: '1d6+2', tipo: 'cortante' })
  })
  it('soma o dano extra e ignora o que vem depois da frase', () => {
    const [a] = ataquesDoMonstro(
      m([
        {
          nome: 'Mordida',
          texto:
            'Ataque Corpo a Corpo com Arma: +11 para acertar, alcance 3 m, um alvo. Acerto: 17 (2d10 + 6) de dano perfurante mais 4 (1d8) de dano de ácido. Depois, 9 (2d8) de dano de fogo.',
        },
      ]),
    )
    expect(a!.dano).toBe('2d10+6+1d8')
    expect(a!.tipo).toBe('perfurante + ácido')
  })
  it('alternativa com duas mãos fica de fora; ação sem ataque é ignorada; bônus negativo', () => {
    const l = ataquesDoMonstro(
      m([
        { nome: 'Multiataque', texto: 'O ogro faz dois ataques.' },
        {
          nome: 'Lança',
          texto: 'Ataque: -1 para acertar. Acerto: 4 (1d6 + 1) de dano perfurante, ou 5 (1d8 + 1) de dano perfurante se usada com duas mãos.',
        },
      ]),
    )
    expect(l).toEqual([{ nome: 'Lança', bonus: -1, dano: '1d6+1', tipo: 'perfurante' }])
  })
})

it('dano fixo e acerto sem dano', () => {
  const l = ataquesDoMonstro(
    m([
      { nome: 'Garras', texto: 'Ataque Corpo a Corpo com Arma: +0 para acertar, alcance 1,5 m, um alvo. Acerto: 1 de dano cortante.' },
      { nome: 'Teia', texto: 'Ataque à Distância com Arma: +5 para acertar. Acerto: o alvo fica impedido pela teia.' },
    ]),
  )
  expect(l).toEqual([
    { nome: 'Garras', bonus: 0, dano: '1', tipo: 'cortante' },
    { nome: 'Teia', bonus: 5, dano: '', tipo: '' },
  ])
})

describe('resultado do ataque', () => {
  it('compara com a CA e respeita 1 e 20 naturais', () => {
    expect(resultadoDoAtaque(15, 10, 15)).toBe('acerto')
    expect(resultadoDoAtaque(14, 10, 15)).toBe('erro')
    expect(resultadoDoAtaque(5, 20, 30)).toBe('critico')
    expect(resultadoDoAtaque(40, 1, 10)).toBe('falha-critica')
    expect(resultadoDoAtaque(15, 10, null)).toBeNull()
  })
})
