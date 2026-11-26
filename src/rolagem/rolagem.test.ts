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

describe('variações de resultado', () => {
  // Sequência fixa de dados: cada chamada devolve o próximo valor.
  const fixos = (lados: number, ...valores: number[]) => {
    let i = 0
    return () => (valores[i++]! - 1) / lados + 0.0001
  }

  it('lê as notações e recusa as inválidas', () => {
    expect(interpretar('4d6kh3')?.dados[0]).toEqual({ quantidade: 4, lados: 6, regra: { tipo: 'kh', n: 3 } })
    expect(interpretar('2d20kl')?.dados[0]?.regra).toEqual({ tipo: 'kl', n: 1 })
    expect(interpretar('6d6>=5')?.dados[0]?.regra).toEqual({ tipo: 'sucesso', alvo: 5 })
    expect(interpretar('6d6>4')?.dados[0]?.regra).toEqual({ tipo: 'sucesso', alvo: 5 })
    expect(interpretar('4d6kh5')).toBeNull()
    expect(interpretar('4d6dl4')).toBeNull()
    expect(interpretar('4d6>=7')).toBeNull()
  })

  it('maior, menor, os N maiores e descartar o menor', () => {
    const r = (e: string) => rolar(e, { aleatorio: fixos(6, 2, 6, 3, 5) })!
    expect(r('4d6kh1').total).toBe(6)
    expect(r('4d6kl1').total).toBe(2)
    expect(r('4d6kh3').total).toBe(6 + 5 + 3)
    expect(r('4d6kl2').total).toBe(2 + 3)
    expect(r('4d6dl1').total).toBe(6 + 5 + 3)
    expect(r('4d6dh1').total).toBe(2 + 3 + 5)
    expect(r('4d6kh1+2').total).toBe(8)
    expect(r('4d6kh1').dados.filter((d) => !d.descartado).map((d) => d.valor)).toEqual([6])
    expect(r('4d6kh3').expressao).toBe('4d6kh3')
  })

  it('conta sucessos', () => {
    const r = rolar('5d6>=5', { aleatorio: fixos(6, 5, 1, 6, 4, 5) })!
    expect(r.total).toBe(3)
    expect(r.sucessos).toBe(true)
  })

  it('2d20 com o maior marca o d20 natural', () => {
    expect(rolar('2d20kh1', { aleatorio: fixos(20, 20, 3) })!.d20).toBe(20)
  })
})

describe('rolagem secreta', () => {
  it('marca a rolagem e não muda o resultado', () => {
    const r = rolar('1d20+2', { secreta: true, aleatorio: () => 0 })
    expect(r?.secreta).toBe(true)
    expect(r?.total).toBe(3)
    expect(rolar('1d20+2', { aleatorio: () => 0 })?.secreta).toBeUndefined()
  })
})
