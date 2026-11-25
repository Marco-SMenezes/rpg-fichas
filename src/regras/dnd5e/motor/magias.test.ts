import { describe, expect, it } from 'vitest'
import { MAGIAS } from '../dados/magias'
import { criarPersonagem, type EscolhasDeCriacao } from './criacao'
import { alternarMagia, contagemDeMagias, magiasDisponiveis, segredosMagicos } from './magias'
import { calcularFicha } from './ficha'
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
    expect(contagemDeMagias(com)).toEqual({ truques: 0, conhecidas: 2, preparadas: 2, segredos: 0 })
    expect(contagemDeMagias(alternarMagia(com, 'bencao')).conhecidas).toBe(1)
  })
})

describe('Segredos Mágicos do bardo (LdJ p. 54–55)', () => {
  const bardo: EscolhasDeCriacao = {
    nome: 'B', conceito: '', jogador: '', racaId: 'humano', subracaId: null, classeId: 'bardo', antecedenteId: 'artista',
    metodoAtributos: 'manual', atributosBase: { for: 8, des: 14, con: 12, int: 10, sab: 10, car: 15 },
    periciasEscolhidas: [], especializacoes: [], ferramentasEscolhidas: [], idiomasEscolhidos: [], equipamento: {},
  }
  // Fixa o nível e a subclasse direto: aqui só importam as regras de magia.
  const em = (nivel: number, subclasseId: string) => ({ ...criarPersonagem(bardo), nivel, subclasseId })

  it('bardo da Bravura só ganha segredos no 10º; Conhecimento já no 6º, além do limite', () => {
    expect(segredosMagicos(em(9, 'bravura'))).toBe(0)
    expect(segredosMagicos(em(10, 'bravura'))).toBe(2)
    expect(segredosMagicos(em(18, 'bravura'))).toBe(6)
    expect(segredosMagicos(em(6, 'conhecimento'))).toBe(2)
    expect(segredosMagicos(em(10, 'conhecimento'))).toBe(4)
    expect(calcularFicha(em(6, 'conhecimento')).conjuracao?.conhecidas).toBe(9 + 2)
    expect(calcularFicha(em(6, 'bravura')).conjuracao?.conhecidas).toBe(9)
  })

  it('outras listas só aparecem com segredos, até o nível que conjura, e contam como segredo', () => {
    const p = em(6, 'conhecimento')
    expect(magiasDisponiveis(p).some((m) => m.id === 'bola-de-fogo')).toBe(false)
    expect(magiasDisponiveis(p, true).some((m) => m.id === 'bola-de-fogo')).toBe(true)
    expect(magiasDisponiveis(p, true).some((m) => m.nivel > 3)).toBe(false)
    expect(magiasDisponiveis(em(6, 'bravura'), true).some((m) => m.id === 'bola-de-fogo')).toBe(false)
    expect(contagemDeMagias(alternarMagia(p, 'bola-de-fogo')).segredos).toBe(1)
    expect(contagemDeMagias(alternarMagia(p, 'curar-ferimentos')).segredos).toBe(0)
  })
})
