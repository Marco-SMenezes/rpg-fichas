import { describe, expect, it } from 'vitest'
import { problemaNaSenha } from './senha'

describe('problemaNaSenha', () => {
  it('aceita 8 caracteres com maiúscula, minúscula e número', () => {
    expect(problemaNaSenha('Dragao42')).toBeNull()
  })
  it('recusa senha curta', () => {
    expect(problemaNaSenha('Ab1')).toMatch(/8 caracteres/)
  })
  it('aponta o que falta', () => {
    expect(problemaNaSenha('dragao42')).toMatch(/maiúscula/)
    expect(problemaNaSenha('DRAGAO42')).toMatch(/minúscula/)
    expect(problemaNaSenha('Dragaozz')).toMatch(/número/)
  })
  it('letra acentuada não conta como maiúscula ou minúscula', () => {
    expect(problemaNaSenha('ÁÉÍÓÚ123')).toMatch(/minúscula/)
  })
})

describe('problemaNaSenha com várias faltas', () => {
  it('lista tudo que falta', () => {
    expect(problemaNaSenha('12345678')).toBe('Falta uma letra maiúscula e uma letra minúscula na senha.')
    expect(problemaNaSenha('!!!!!!!!')).toBe('Falta uma letra maiúscula, uma letra minúscula e um número na senha.')
  })
})
