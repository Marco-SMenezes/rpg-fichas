import { describe, expect, it } from 'vitest'
import { contraste, lerPreferencias, normalizarHex, resolverModo, textoSobre } from './tema'

describe('tema', () => {
  it('normaliza cores', () => {
    expect(normalizarHex('#ABC')).toBe('#aabbcc')
    expect(normalizarHex('d0783f')).toBe('#d0783f')
    expect(normalizarHex('vermelho')).toBeNull()
  })
  it('contraste segue a fórmula da WCAG', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contraste('#777777', '#777777')).toBe(1)
  })
  it('texto sobre o destaque: branco em cores escuras, escuro em cores claras', () => {
    expect(textoSobre('#1f3a8a')).toBe('#ffffff')
    expect(textoSobre('#f2d24b')).toBe('#16181d')
  })
  it('modo automático segue o sistema', () => {
    expect(resolverModo('sistema', true)).toBe('escuro')
    expect(resolverModo('sistema', false)).toBe('claro')
    expect(resolverModo('claro', true)).toBe('claro')
  })
  it('preferências inválidas voltam ao padrão', () => {
    expect(lerPreferencias('{lixo')).toEqual({ modo: 'sistema', acento: '#d0783f' })
    expect(lerPreferencias('{"modo":"rosa","acento":"#123"}')).toEqual({ modo: 'sistema', acento: '#112233' })
  })
})
