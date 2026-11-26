import { describe, expect, it } from 'vitest'
import { normalizarMonstro } from '../regras/dnd5e/dados/monstros/busca'
import type { Monstro } from '../regras/dnd5e/dados/monstros/tipos'
import { linhaDeSegredo, linhasDeMonstros } from './combate'

const goblin = normalizarMonstro(
  { id: 'srd-goblin', nome: 'Goblin', ca: 15, pv: 7, dadosDeVida: '2d6', tipo: 'Humanoide', atributos: { des: 14 } },
  'srd',
) as Monstro

describe('combate na nuvem: linhas', () => {
  it('segredo do monstro leva vida, CA e a cópia do bloco', () => {
    expect(linhaDeSegredo(goblin, 9)).toEqual({ pv: 9, pv_max: 9, pv_temp: 0, ca: 15, condicoes: [], monstro: goblin })
  })
  it('monstros entram numerados, com Destreza no desempate e PV médio', () => {
    const l = linhasDeMonstros(goblin, 2, false, ['Goblin 1'])
    expect(l.map((x) => x.participante.nome)).toEqual(['Goblin 2', 'Goblin 3'])
    expect(l[0]!.participante).toMatchObject({ tipo: 'monstro', desempate: 2, resumo: 'Monstro · Humanoide', iniciativa: null })
    expect(l[0]!.participante).not.toHaveProperty('pv')
    expect(l.map((x) => x.segredo.pv)).toEqual([7, 7])
  })
  it('com rolar PV, usa os dados de vida', () => {
    const l = linhasDeMonstros(goblin, 1, true, [], () => 0)
    expect(l[0]!.segredo.pv).toBe(2)
  })
})

describe('foto do monstro no combate', () => {
  it('foto grande demais não vai para a linha (o banco recusaria)', () => {
    const comFoto = { ...goblin, foto: 'data:image/jpeg;base64,' + 'A'.repeat(70000) }
    expect(linhasDeMonstros(comFoto, 1, false, [])[0]!.participante.foto).toBeNull()
    const pequena = { ...goblin, foto: 'data:image/jpeg;base64,AAAA' }
    expect(linhasDeMonstros(pequena, 1, false, [])[0]!.participante.foto).toBe(pequena.foto)
  })
})
