import { describe, expect, it } from 'vitest'
import { ANTECEDENTES } from '../dados/antecedentes'
import { criarPersonagem, type EscolhasDeCriacao } from './criacao'
import { calcularFicha } from './ficha'

const com = (antecedenteId: string, ferramentasEscolhidas: string[] = []): EscolhasDeCriacao => ({
  nome: 'Teste',
  conceito: '',
  jogador: '',
  racaId: 'humano',
  subracaId: null,
  classeId: 'ladino',
  antecedenteId,
  metodoAtributos: 'manual',
  atributosBase: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
  periciasEscolhidas: [],
  especializacoes: [],
  ferramentasEscolhidas,
  idiomasEscolhidos: [],
  equipamento: {},
})

describe('antecedentes (LdJ cap. 4)', () => {
  it('são os 13 do livro, cada um com 2 perícias, página e característica', () => {
    expect(ANTECEDENTES.map((a) => a.nome)).toEqual([
      'Acólito', 'Artesão de guilda', 'Artista', 'Charlatão', 'Criminoso', 'Eremita', 'Forasteiro',
      'Herói do povo', 'Marinheiro', 'Nobre', 'Órfão', 'Sábio', 'Soldado',
    ])
    for (const a of ANTECEDENTES) {
      expect(a.pericias).toHaveLength(2)
      expect(a.pagina).toBeGreaterThanOrEqual(129)
      expect(a.caracteristica.resumo.length).toBeGreaterThan(10)
    }
  })

  it('idiomas extras: acólito e sábio dois; eremita, forasteiro, nobre e artesão um', () => {
    const idiomas = Object.fromEntries(ANTECEDENTES.map((a) => [a.id, a.idiomasExtras]))
    expect(idiomas).toMatchObject({ acolito: 2, sabio: 2, eremita: 1, forasteiro: 1, nobre: 1, artesao: 1, soldado: 0 })
  })

  it('moedas iniciais', () => {
    expect(criarPersonagem(com('nobre')).moedas.po).toBe(25)
    expect(criarPersonagem(com('eremita')).moedas.po).toBe(5)
    expect(criarPersonagem(com('soldado')).moedas.po).toBe(10)
  })

  it('a ferramenta escolhida pelo artista entra na mochila; a do forasteiro não', () => {
    const artista = criarPersonagem(com('artista', ['Alaúde']))
    expect(artista.inventario.find((i) => i.nome === 'Alaúde')).toMatchObject({ peso: 1 })
    expect(calcularFicha(artista).proficiencias.ferramentas).toEqual(expect.arrayContaining(['Kit de disfarce', 'Alaúde']))
    const forasteiro = criarPersonagem(com('forasteiro', ['Flauta']))
    expect(forasteiro.inventario.some((i) => i.nome === 'Flauta')).toBe(false)
  })

  it('perícias do antecedente entram na ficha; forasteiro vem com bordão como ataque', () => {
    const f = calcularFicha(criarPersonagem(com('forasteiro')))
    expect(f.pericias.filter((p) => p.grau > 0).map((p) => p.id)).toEqual(['atletismo', 'sobrevivencia'])
    expect(f.ataques.map((a) => a.nome)).toContain('Bordão')
  })
})
