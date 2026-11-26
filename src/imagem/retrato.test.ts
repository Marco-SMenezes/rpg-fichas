import { describe, expect, it } from 'vitest'
import { retratoValido, tamanhoReduzido } from './retrato'

describe('foto do personagem', () => {
  it('reduz mantendo a proporção e não aumenta fotos pequenas', () => {
    expect(tamanhoReduzido(4000, 3000)).toEqual({ largura: 480, altura: 360 })
    expect(tamanhoReduzido(1080, 1920)).toEqual({ largura: 270, altura: 480 })
    expect(tamanhoReduzido(200, 100)).toEqual({ largura: 200, altura: 100 })
    expect(tamanhoReduzido(0, 100)).toEqual({ largura: 0, altura: 0 })
  })
  it('só aceita imagem em data URL', () => {
    expect(retratoValido('data:image/jpeg;base64,/9j/4AAQ')).toBe(true)
    expect(retratoValido('https://exemplo.com/a.jpg')).toBe(false)
    expect(retratoValido('data:text/html;base64,PGI+')).toBe(false)
    expect(retratoValido(42)).toBe(false)
  })
})
