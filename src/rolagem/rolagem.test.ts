import { describe, expect, it } from 'vitest'
import { interpretar, rolar } from './rolagem'

const sequencia = (...valores: number[]) => {
  let i = 0
  // converte um resultado desejado de dado em número aleatório
  return (lados: number) => () => (valores[i++]! - 1) / lados + 0.0001
}

describe('interpretar', () => {
  it('lê dados e modificadores', () => {
    expect(interpretar('2d6+3')).toEqual({ dados: [{ quantidade: 2, lados: 6 }], modificador: 3 })
    expect(interpretar('d20 - 1')).toEqual({ dados: [{ quantidade: 1, lados: 20 }], modificador: -1 })
    expect(interpretar('1d8+1d6+2')).toEqual({
      dados: [
        { quantidade: 1, lados: 8 },
        { quantidade: 1, lados: 6 },
      ],
      modificador: 2,
    })
  })
  it('recusa texto inválido', () => {
    expect(interpretar('abc')).toBeNull()
    expect(interpretar('2d')).toBeNull()
    expect(interpretar('')).toBeNull()
  })
})

describe('rolar', () => {
  it('soma dados e modificador', () => {
    const r = rolar('2d6+3', { aleatorio: sequencia(4, 5)(6) })!
    expect(r.total).toBe(12)
  })
  it('vantagem fica com o maior d20', () => {
    const r = rolar('1d20+5', { modo: 'vantagem', aleatorio: sequencia(7, 15)(20) })!
    expect(r.d20).toBe(15)
    expect(r.total).toBe(20)
    expect(r.dados.filter((d) => d.descartado)).toHaveLength(1)
  })
  it('desvantagem fica com o menor d20', () => {
    const r = rolar('1d20+5', { modo: 'desvantagem', aleatorio: sequencia(7, 15)(20) })!
    expect(r.d20).toBe(7)
    expect(r.total).toBe(12)
  })
  it('crítico dobra os dados, não o modificador (LdJ p. 198)', () => {
    const r = rolar('1d8+3', { critico: true, aleatorio: sequencia(8, 8)(8) })!
    expect(r.dados).toHaveLength(2)
    expect(r.total).toBe(19)
  })
  it('d100', () => {
    const r = rolar('1d100', { aleatorio: sequencia(42)(100) })!
    expect(r.total).toBe(42)
  })
})
