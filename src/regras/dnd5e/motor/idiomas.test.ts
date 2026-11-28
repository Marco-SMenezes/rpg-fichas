import { describe, expect, it } from 'vitest'
import { semIdiomasConhecidos } from './idiomas'

const opcoes = ['Anão', 'Comum', 'Élfico', 'Subcomum'].map((x) => ({ id: x, nome: x, resumo: '' }))
const ids = (l: { id: string }[]) => l.map((o) => o.id)

describe('semIdiomasConhecidos', () => {
  it('tira os idiomas que a ficha já fala', () => {
    expect(ids(semIdiomasConhecidos(opcoes, ['Comum', 'Élfico']))).toEqual(['Anão', 'Subcomum'])
  })
  it('mantém a opção já escolhida nesta lista, mesmo que conte como conhecida', () => {
    expect(ids(semIdiomasConhecidos(opcoes, ['Comum', 'Anão'], 'Anão'))).toEqual(['Anão', 'Élfico', 'Subcomum'])
  })
  it('compara o nome inteiro (Comum não esconde Subcomum)', () => {
    expect(ids(semIdiomasConhecidos(opcoes, ['Comum']))).toContain('Subcomum')
  })
})
