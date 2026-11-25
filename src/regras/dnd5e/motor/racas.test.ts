import { describe, expect, it } from 'vitest'
import { RACAS } from '../dados/racas'
import type { EscolhasRaciais } from '../tipos'
import { criarPersonagem, periciasRepetidas, type EscolhasDeCriacao } from './criacao'
import { calcularFicha } from './ficha'
import { subirDeNivel } from './progressao'

/** Ladino com atributos 10 em tudo, para isolar o que vem da raça. */
const base = (racaId: string, subracaId: string | null, escolhasRaciais: Partial<EscolhasRaciais> = {}): EscolhasDeCriacao => ({
  nome: 'Teste',
  conceito: '',
  jogador: '',
  racaId,
  subracaId,
  classeId: 'ladino',
  antecedenteId: 'charlatao',
  metodoAtributos: 'manual',
  atributosBase: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
  periciasEscolhidas: ['acrobacia', 'atletismo', 'investigacao', 'percepcao'],
  especializacoes: [],
  ferramentasEscolhidas: [],
  idiomasEscolhidos: [],
  equipamento: {},
  escolhasRaciais,
})
const ficha = (...args: Parameters<typeof base>) => calcularFicha(criarPersonagem(base(...args)))
const valores = (f: ReturnType<typeof ficha>) => Object.fromEntries(Object.entries(f.atributos).map(([k, a]) => [k, a.valor]))

describe('aumentos de atributo de cada raça (LdJ cap. 2)', () => {
  it.each([
    ['anao', 'anao-colina', { con: 12, sab: 11 }],
    ['anao', 'anao-montanha', { con: 12, for: 12 }],
    ['elfo', 'elfo-alto', { des: 12, int: 11 }],
    ['elfo', 'elfo-drow', { des: 12, car: 11 }],
    ['halfling', 'halfling-pes-leves', { des: 12, car: 11 }],
    ['halfling', 'halfling-robusto', { des: 12, con: 11 }],
    ['humano', null, { for: 11, des: 11, con: 11, int: 11, sab: 11, car: 11 }],
    ['draconato', null, { for: 12, car: 11 }],
    ['gnomo', 'gnomo-floresta', { int: 12, des: 11 }],
    ['gnomo', 'gnomo-rochas', { int: 12, con: 11 }],
    ['meio-orc', null, { for: 12, con: 11 }],
    ['tiefling', null, { int: 11, car: 12 }],
  ] as const)('%s %s', (raca, sub, esperado) => {
    expect(valores(ficha(raca, sub))).toMatchObject(esperado)
  })

  it('meio-elfo: Carisma +2 e +1 em dois à escolha, sem repetir Carisma', () => {
    const f = ficha('meio-elfo', null, { aumentos: ['des', 'con', 'car'] })
    expect(valores(f)).toMatchObject({ car: 12, des: 11, con: 11, for: 10 })
  })
})

describe('mecânicas raciais', () => {
  it('deslocamento e tamanho', () => {
    expect(ficha('anao', 'anao-colina').deslocamento).toBe(7.5)
    expect(ficha('halfling', 'halfling-robusto')).toMatchObject({ deslocamento: 7.5, tamanho: 'Pequeno' })
    expect(ficha('elfo', 'elfo-floresta').deslocamento).toBe(10.5)
    expect(ficha('humano', null).deslocamento).toBe(9)
  })

  it('anão da colina ganha +1 PV por nível', () => {
    const p = criarPersonagem(base('anao', 'anao-colina'))
    // Con 12 (+1): 8 + 1 + 1 no 1º nível
    expect(calcularFicha(p).pvMaximo).toBe(10)
    expect(p.estado.pvAtual).toBe(10)
    const p2 = subirDeNivel(p, { pv: 5 })
    expect(calcularFicha(p2).pvMaximo).toBe(10 + 5 + 1 + 1)
  })

  it('anão da montanha ganha armaduras leves e médias', () => {
    expect(ficha('anao', 'anao-montanha').proficiencias.armaduras).toEqual(['Armaduras leves', 'Armaduras médias'])
  })

  it('resistências a dano e visão no escuro', () => {
    expect(ficha('anao', 'anao-colina').resistenciasDano).toEqual(['veneno'])
    expect(ficha('tiefling', null).resistenciasDano).toEqual(['fogo'])
    expect(ficha('elfo', 'elfo-drow').visaoNoEscuro).toBe(36)
    expect(ficha('humano', null).visaoNoEscuro).toBeNull()
  })

  it('draconato: sopro e resistência pelo ancestral', () => {
    const f = ficha('draconato', null, { ancestral: 'verde' })
    // Con 10, proficiência +2: CD 10
    expect(f.sopro).toEqual({ dano: '2d6', tipo: 'veneno', area: 'Cone de 4,5 m', teste: 'con', cd: 10 })
    expect(f.resistenciasDano).toEqual(['veneno'])
    expect(ficha('draconato', null).sopro).toBeNull()
  })

  it('sopro do draconato cresce no 6º, 11º e 16º nível', () => {
    let p = criarPersonagem(base('draconato', null, { ancestral: 'vermelho' }))
    const dados: string[] = []
    for (let n = 2; n <= 16; n++) {
      p = subirDeNivel(p, {
        pv: 5,
        subclasseId: n === 3 ? 'assassino' : undefined,
        incremento: [4, 8, 10, 12, 16].includes(n) ? { for: 1, car: 1 } : undefined,
        especializacoes: n === 6 ? ['acrobacia', 'atletismo'] : undefined,
      })
      if ([5, 6, 10, 11, 15, 16].includes(n)) dados.push(calcularFicha(p).sopro!.dano)
    }
    expect(dados).toEqual(['2d6', '3d6', '3d6', '4d6', '4d6', '5d6'])
  })

  it('perícias raciais: meio-orc tem Intimidação; meio-elfo escolhe duas', () => {
    const orc = ficha('meio-orc', null)
    expect(orc.pericias.find((x) => x.id === 'intimidacao')!.grau).toBe(1)
    const me = ficha('meio-elfo', null, { pericias: ['historia', 'natureza', 'religiao'] })
    expect(me.pericias.filter((x) => ['historia', 'natureza', 'religiao'].includes(x.id)).map((x) => x.grau)).toEqual([1, 1, 0])
  })

  it('perícia racial repetida com o antecedente vira escolha livre', () => {
    expect(periciasRepetidas('meio-elfo', null, 'charlatao', ['enganacao', 'historia'])).toBe(1)
  })

  it('ferramentas raciais: anão escolhe uma; gnomo das rochas tem engenhoqueiro', () => {
    expect(ficha('anao', 'anao-colina', { ferramenta: 'Ferramentas de ferreiro' }).proficiencias.ferramentas).toContain('Ferramentas de ferreiro')
    expect(ficha('gnomo', 'gnomo-rochas').proficiencias.ferramentas).toContain('Ferramentas de engenhoqueiro')
  })

  it('armas raciais: drow tem besta de mão; anão tem machado de batalha', () => {
    expect(ficha('elfo', 'elfo-drow').proficiencias.armas).toContain('Besta de mão')
    expect(ficha('anao', 'anao-colina').proficiencias.armas).toContain('Machado de batalha')
  })

  it('toda raça tem página e traços com resumo', () => {
    for (const r of RACAS) {
      expect(r.pagina).toBeGreaterThan(0)
      for (const tr of [...r.tracos, ...r.subracas.flatMap((s) => s.tracos)]) expect(tr.resumo.length).toBeGreaterThan(5)
    }
  })
})
