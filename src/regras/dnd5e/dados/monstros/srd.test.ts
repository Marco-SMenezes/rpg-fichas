import { describe, expect, it } from 'vitest'
import { carregarSRD } from './srd'

const SENTINELAS = /\b(to hit|feet|ft\.|damage|saving throw|the|creature|target)\b/i

describe('bestiário do SRD', async () => {
  const lista = await carregarSRD()
  const porId = new Map(lista.map((m) => [m.id, m]))

  it('tem os 322 monstros, sem repetir id', () => {
    expect(lista).toHaveLength(322)
    expect(porId.size).toBe(322)
  })

  it('confere o Goblin', () => {
    const g = porId.get('srd-goblin')!
    expect([g.ca, g.pv, g.nd]).toEqual([15, 7, '1/4'])
    expect(g.acoes[0]!.nome).toBe('Cimitarra')
    expect(g.acoes[0]!.texto).toContain('+4 para acertar')
    expect(g.acoes[0]!.texto).toContain('1,5 m')
  })

  it('confere o Dragão Vermelho Adulto', () => {
    const d = porId.get('srd-adult-red-dragon')!
    expect([d.pv, d.nd, d.lendarias.length]).toEqual([256, '17', 3])
    expect(d.nome).toBe('Dragão Vermelho Adulto')
  })

  it('não sobra inglês nos textos', () => {
    const sobras = lista.flatMap((m) =>
      [
        m.nome,
        m.caDescricao,
        m.descricaoLendaria,
        m.idiomas,
        m.sentidos,
        m.deslocamento,
        m.resistencias,
        m.imunidades,
        m.vulnerabilidades,
        ...[m.tracos, m.acoes, m.acoesBonus, m.reacoes, m.lendarias].flat().flatMap((t) => [t.nome, t.texto]),
      ]
        .filter((t) => SENTINELAS.test(t))
        .map((t) => `${m.id}: ${t.slice(0, 60)}`),
    )
    expect(sobras).toEqual([])
  })
})
