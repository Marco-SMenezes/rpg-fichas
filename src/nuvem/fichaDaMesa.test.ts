import { describe, expect, it } from 'vitest'
import { modeloDeExemplo, valoresIniciais } from '../universal/modelo'
import { fichaDaMesaDeDados } from './campanhas'

describe('fichaDaMesaDeDados', () => {
  it('lê ficha livre com a cópia do modelo', () => {
    const modelo = modeloDeExemplo()
    const ficha = { id: 'livre-1', modeloId: modelo.id, nome: 'Kai', valores: valoresIniciais(modelo), criadoEm: 'x', atualizadoEm: 'x' }
    const r = fichaDaMesaDeDados({ sistema: 'livre', nome: 'Kai', ficha, modelo })
    expect(r?.tipo).toBe('livre')
    if (r?.tipo === 'livre') {
      expect(r.ficha.nome).toBe('Kai')
      expect(r.modelo.id).toBe(modelo.id)
    }
  })

  it('ficha livre sem modelo não abre', () => {
    expect(fichaDaMesaDeDados({ sistema: 'livre', ficha: { id: 'livre-1', modeloId: 'm', nome: 'Kai', valores: {} } })).toBeNull()
  })

  it('lixo não vira ficha', () => {
    expect(fichaDaMesaDeDados({ qualquer: 1 })).toBeNull()
    expect(fichaDaMesaDeDados(null)).toBeNull()
  })
})
