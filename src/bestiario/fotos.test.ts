import { describe, expect, it } from 'vitest'
import { normalizarMonstro, tipoDoResumo } from '../regras/dnd5e/dados/monstros/busca'
import type { Monstro } from '../regras/dnd5e/dados/monstros/tipos'
import { comFoto, fotosDeMonstros, listarFotosDeMonstros, normalizarFotoDeMonstro } from './fotos'

const FOTO = 'data:image/jpeg;base64,AAAA'
const goblin = normalizarMonstro({ id: 'srd-goblin', nome: 'Goblin', tipo: 'Humanoide' }, 'srd') as Monstro

describe('fotos dos monstros do SRD', () => {
  it('guarda a foto por monstro e aplica na hora de mostrar', () => {
    fotosDeMonstros.definir('srd-goblin', FOTO)
    const fotos = listarFotosDeMonstros()
    expect(comFoto(goblin, fotos).foto).toBe(FOTO)
    expect(goblin.foto).toBeUndefined()
  })
  it('a foto do próprio monstro (meus monstros) vale mais que a guardada', () => {
    const meu = { ...goblin, foto: 'data:image/jpeg;base64,BBBB' }
    expect(comFoto(meu, { 'srd-goblin': FOTO }).foto).toBe(meu.foto)
  })
  it('tirar a foto volta ao ícone', () => {
    fotosDeMonstros.remover('srd-goblin')
    expect(comFoto(goblin, listarFotosDeMonstros()).foto).toBeUndefined()
  })
  it('lê da nuvem só fotos válidas', () => {
    expect(normalizarFotoDeMonstro({ id: 'fotomonstro-srd-goblin', monstroId: 'srd-goblin', foto: FOTO, atualizadoEm: 'x' })?.monstroId).toBe(
      'srd-goblin',
    )
    expect(normalizarFotoDeMonstro({ id: 'fotomonstro-x', monstroId: 'x', foto: 'javascript:alert(1)', atualizadoEm: 'x' })).toBeNull()
  })
})

describe('tipo pelo resumo da linha do combate', () => {
  it('"Monstro · Humanoide" → Humanoide; ficha do mestre não tem tipo', () => {
    expect(tipoDoResumo('Monstro · Humanoide')).toBe('Humanoide')
    expect(tipoDoResumo('Personagem do mestre')).toBeNull()
  })
})
