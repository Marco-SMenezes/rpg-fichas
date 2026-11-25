import { describe, expect, it } from 'vitest'
import { rolar } from '../rolagem/rolagem'
import { codigoValido, juntarRolagens, lerRolagemDaMesa, linhaDeRolagem, normalizarCodigo, type RolagemDaMesa } from './mesa'

describe('código de convite', () => {
  it('aceita minúsculas, espaços e hífen', () => {
    expect(normalizarCodigo(' ab3-k9q ')).toBe('AB3K9Q')
    expect(codigoValido('ab3 k9q')).toBe(true)
  })
  it('recusa tamanho errado e letras ambíguas', () => {
    expect(codigoValido('AB3K9')).toBe(false)
    expect(codigoValido('AB3K9O')).toBe(false)
    expect(codigoValido('AB3K91')).toBe(false)
  })
})

describe('rolagens da mesa', () => {
  const r = rolar('1d20+5', { rotulo: 'Furtividade', modo: 'vantagem', aleatorio: () => 0.5 })!

  it('linha e leitura fazem o caminho de ida e volta', () => {
    const linha = linhaDeRolagem('c1', 'Lia', r)
    const lida = lerRolagemDaMesa({ ...linha, id: 7, autor: 'u', criado_em: '2026-11-25T10:00:00Z' })
    expect(lida).toMatchObject({ id: 7, quem: 'Lia', rotulo: 'Furtividade', total: r.total })
    expect(lida?.detalhe.modo).toBe('vantagem')
    expect(lida?.detalhe.dados).toHaveLength(2)
  })

  it('tolera detalhe faltando e recusa lixo', () => {
    expect(lerRolagemDaMesa({ id: 1, campanha_id: 'c', total: 3 })?.detalhe).toEqual({
      modo: 'normal',
      critico: false,
      dados: [],
      modificador: 0,
      d20: null,
    })
    expect(lerRolagemDaMesa({ id: '1' })).toBeNull()
    expect(lerRolagemDaMesa(null)).toBeNull()
  })

  it('junta sem repetir, mais novas primeiro', () => {
    const x = (id: number) => ({ id }) as RolagemDaMesa
    expect(juntarRolagens([x(3), x(2)], [x(4), x(3)]).map((y) => y.id)).toEqual([4, 3, 2])
    expect(juntarRolagens([x(1), x(2), x(3)], [], 2).map((y) => y.id)).toEqual([3, 2])
  })
})
