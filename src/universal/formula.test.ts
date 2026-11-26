import { describe, expect, it } from 'vitest'
import { calcular, ErroDeFormula, lerFormula, nomesUsados } from './formula'

const valores: Record<string, number> = { forca: 14, destreza: 9, vigor: 3, nível: 5 }
const conta = (f: string) => calcular(lerFormula(f), (n) => valores[n])

describe('fórmulas da ficha livre', () => {
  it('contas com precedência, parênteses e sinal', () => {
    expect(conta('2 + 3 * 4')).toBe(14)
    expect(conta('(2 + 3) * 4')).toBe(20)
    expect(conta('-forca + 20')).toBe(6)
    expect(conta('10 / 4')).toBe(2.5)
    expect(conta('7 / 0')).toBe(0)
  })

  it('usa campos (com acento) e funções', () => {
    expect(conta('floor((forca - 10) / 2)')).toBe(2)
    expect(conta('floor((destreza - 10) / 2)')).toBe(-1)
    expect(conta('max(1, vigor - 5)')).toBe(1)
    expect(conta('min(forca, destreza, 20)')).toBe(9)
    expect(conta('nível * 2')).toBe(10)
    expect(conta('FLOOR(3.7)')).toBe(3)
  })

  it('aceita × ÷ e −', () => {
    expect(conta('6 × 2 ÷ 3 − 1')).toBe(3)
  })

  it('lista os campos usados', () => {
    expect(nomesUsados(lerFormula('max(forca, destreza) + vigor * 2'))).toEqual(['forca', 'destreza', 'vigor'])
  })

  it('erros em português', () => {
    expect(() => lerFormula('2 +')).toThrow(ErroDeFormula)
    expect(() => lerFormula('(2 + 3')).toThrow(/parêntese/)
    expect(() => lerFormula('2 $ 3')).toThrow(/Símbolo/)
    expect(() => lerFormula('raiz(4)')).toThrow(/desconhecida/)
    expect(() => lerFormula('floor(1, 2)')).toThrow(/recebe/)
    expect(() => lerFormula('')).toThrow(/vazia/)
    expect(() => conta('sorte + 1')).toThrow(/desconhecido: sorte/)
  })

  it('não executa código', () => {
    expect(() => lerFormula('alert(1)')).toThrow(/desconhecida/)
    expect(() => lerFormula('constructor.constructor("x")()')).toThrow()
  })
})
