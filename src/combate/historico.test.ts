import { describe, expect, it } from 'vitest'
import { textoDaEntrada } from './historico'

const e = (x: Partial<Parameters<typeof textoDaEntrada>[0]>) => textoDaEntrada({ tipo: 'vida', nome: 'Lia', de: null, para: null, detalhe: '', ...x })

describe('textoDaEntrada', () => {
  it('dano e cura', () => {
    expect(e({ de: 18, para: 12 })).toBe('Lia: tomou 6 de dano (18 PV → 12 PV)')
    expect(e({ de: 3, para: 10 })).toBe('Lia: recuperou 7 (3 PV → 10 PV)')
  })
  it('turnos e rodadas', () => {
    expect(e({ tipo: 'rodada', para: 3 })).toBe('Rodada 3')
    expect(e({ tipo: 'vez' })).toBe('Vez de Lia')
    expect(e({ tipo: 'vez', nome: '' })).toBe('Vez de alguém que saiu')
  })
  it('condições, entradas e morte', () => {
    expect(e({ tipo: 'condicao', detalhe: 'Envenenado', para: 1 })).toBe('Lia ganhou a condição Envenenado')
    expect(e({ tipo: 'condicao', detalhe: 'Envenenado', para: 0 })).toBe('Lia perdeu a condição Envenenado')
    expect(e({ tipo: 'entrou', nome: 'Goblin 1' })).toBe('Goblin 1 entrou no combate')
    expect(e({ tipo: 'saiu', nome: 'Goblin 1' })).toBe('Goblin 1 saiu do combate')
    expect(e({ tipo: 'morte', detalhe: 'falha', para: 2 })).toBe('Lia: falha no teste contra a morte (2/3)')
  })
})
