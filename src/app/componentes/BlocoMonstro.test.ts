import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { carregarSRD } from '../../regras/dnd5e/dados/monstros/srd'
import { BlocoMonstro, trechosRolaveis } from './BlocoMonstro'

describe('trechosRolaveis', () => {
  it('separa acerto e dano em rolagens', () => {
    const t = trechosRolaveis(
      'Ataque Corpo a Corpo com Arma: +4 para acertar, alcance 1,5 m, um alvo. Acerto: 5 (1d6 + 2) de dano cortante.',
      'Cimitarra',
    )
    expect(t.filter((x) => 'expressao' in x).map((x) => ('expressao' in x ? x.expressao : ''))).toEqual(['1d20+4', '1d6+2'])
    expect(t.map((x) => ('texto' in x ? x.texto : x.mostrar)).join('')).toBe(
      'Ataque Corpo a Corpo com Arma: +4 para acertar, alcance 1,5 m, um alvo. Acerto: 5 (1d6 + 2) de dano cortante.',
    )
  })
  it('bônus de ataque negativo também rola', () => {
    const t = trechosRolaveis('Ataque Corpo a Corpo com Arma: -1 para acertar, alcance 1,5 m. Acerto: 1 (1d4 - 1) de dano de concussão.', 'Soco')
    expect(t.filter((x) => 'expressao' in x).map((x) => ('expressao' in x ? x.expressao : ''))).toEqual(['1d20-1', '1d4-1'])
    expect(t.map((x) => ('texto' in x ? x.texto : x.mostrar)).join('')).toContain('-1 para acertar')
  })
  it('dado sem modificador também rola', () => {
    const t = trechosRolaveis('sofrendo 63 (18d6) de dano de fogo', 'Sopro')
    expect(t.filter((x) => 'expressao' in x).map((x) => ('expressao' in x ? x.expressao : ''))).toEqual(['18d6'])
  })
})

describe('BlocoMonstro', async () => {
  const goblin = (await carregarSRD()).find((m) => m.id === 'srd-goblin')!
  it('mostra ações e o nível de desafio, sem seções vazias', () => {
    const html = renderToStaticMarkup(createElement(BlocoMonstro, { m: goblin }))
    expect(html).toContain('Cimitarra')
    expect(html).toContain('Nível de desafio 1/4 (50 XP)')
    expect(html).not.toContain('Reações')
    expect(html).not.toContain('<button')
  })
  it('com aoRolar, acertos e danos viram botões', () => {
    const html = renderToStaticMarkup(createElement(BlocoMonstro, { m: goblin, aoRolar: () => {} }))
    expect(html.match(/data-rolar="1d20\+4"/g)).toHaveLength(2)
    expect(html.match(/data-rolar="1d6\+2"/g)).toHaveLength(2)
  })
})
