import { describe, expect, it } from 'vitest'
import { MAGIAS } from '../dados/magias'
import { criarPersonagem, type EscolhasDeCriacao } from './criacao'
import { alternarMagia, contagemDeMagias, magiasDisponiveis } from './magias'
import { criarEmNivel } from './progressao'

describe('lista de magias (LdJ cap. 11)', () => {
  it('tem as 361 magias, cada uma com resumo, página e pelo menos uma classe', () => {
    expect(MAGIAS).toHaveLength(361)
    for (const m of MAGIAS) {
      expect(m.resumo.length, m.nome).toBeGreaterThan(10)
      expect(m.pagina).toBeGreaterThanOrEqual(215)
      expect(m.pagina).toBeLessThanOrEqual(290)
      expect(m.classes.length, m.nome).toBeGreaterThan(0)
      expect(m.tempo && m.alcance && m.componentes && m.duracao, m.nome).toBeTruthy()
    }
  })
  it('níveis de 0 a 9 e conferências pontuais', () => {
    const por = (id: string) => MAGIAS.find((m) => m.id === id)!
    expect(por('bola-de-fogo')).toMatchObject({ nivel: 3, escola: 'evocação', classes: ['feiticeiro', 'mago'] })
    expect(por('curar-ferimentos').classes).toEqual(expect.arrayContaining(['bardo', 'clerigo', 'druida', 'paladino', 'patrulheiro']))
    expect(por('detectar-magia')).toMatchObject({ ritual: true, nivel: 1 })
    expect(por('bencao').concentracao).toBe(true)
    expect(por('desejo').nivel).toBe(9)
  })
  it('quantidade por classe bate com as listas do livro', () => {
    const conta = (c: string) => MAGIAS.filter((m) => m.classes.includes(c)).length
    expect(conta('paladino')).toBeGreaterThan(30)
    expect(conta('mago')).toBeGreaterThan(190)
  })
})

describe('escolha de magias', () => {
  const paladino: EscolhasDeCriacao = {
    nome: 'P', conceito: '', jogador: '', racaId: 'humano', subracaId: null, classeId: 'paladino', antecedenteId: 'soldado',
    metodoAtributos: 'manual', atributosBase: { for: 15, des: 10, con: 13, int: 8, sab: 10, car: 14 },
    periciasEscolhidas: [], especializacoes: [], ferramentasEscolhidas: [], idiomasEscolhidos: [], equipamento: {},
  }
  it('paladino de 1º nível não tem magias; no 2º, só de 1º nível da lista dele', () => {
    expect(magiasDisponiveis(criarPersonagem(paladino))).toEqual([])
    const p2 = criarEmNivel(paladino, [{ pv: 6, escolhas: { estiloDeLuta: 'defesa' } }])
    const disp = magiasDisponiveis(p2)
    expect(disp.length).toBeGreaterThan(5)
    expect(disp.every((m) => m.nivel === 1 && m.classes.includes('paladino'))).toBe(true)
  })
  it('adicionar e remover conta como preparada', () => {
    const p2 = criarEmNivel(paladino, [{ pv: 6, escolhas: { estiloDeLuta: 'defesa' } }])
    const com = alternarMagia(alternarMagia(p2, 'bencao'), 'escudo-da-fe')
    expect(contagemDeMagias(com)).toEqual({ truques: 0, conhecidas: 2, preparadas: 2 })
    expect(contagemDeMagias(alternarMagia(com, 'bencao')).conhecidas).toBe(1)
  })
})
