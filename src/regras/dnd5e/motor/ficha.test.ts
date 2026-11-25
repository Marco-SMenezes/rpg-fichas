import { describe, expect, it } from 'vitest'
import type { Personagem } from '../tipos'
import { criarPersonagem, custoCompraPontos, compraPontosValida, ferramentasRepetidas, periciasRepetidas, rolar4d6, type EscolhasDeCriacao } from './criacao'
import { calcularFicha } from './ficha'
import { aplicarDano, curar, definirTemporario, descansoCurto, descansoLongo, incrementoValido, requisitosDoProximoNivel, subirDeNivel } from './progressao'

/** Primeiro personagem de verdade: elfo da floresta, ladino, criminoso. */
const escolhas: EscolhasDeCriacao = {
  nome: 'Lia',
  conceito: 'Batedora silenciosa',
  jogador: '',
  racaId: 'elfo',
  subracaId: 'elfo-floresta',
  classeId: 'ladino',
  antecedenteId: 'criminoso',
  metodoAtributos: 'padrao',
  // Valores padrão: Des 15, Con 14, Sab 13, Int 12, Car 10, For 8
  atributosBase: { for: 8, des: 15, con: 14, int: 12, sab: 13, car: 10 },
  periciasEscolhidas: ['acrobacia', 'investigacao', 'prestidigitacao', 'intuicao'],
  especializacoes: ['furtividade', 'prestidigitacao'],
  ferramentasEscolhidas: ['Conjunto de dados'],
  idiomasEscolhidos: [],
  equipamento: { 'arma-principal': 0, 'arma-secundaria': 0, pacote: 0 },
}

const novo = () => criarPersonagem(escolhas, new Date('2026-01-01T00:00:00Z'))

const subirMedia = (p: Personagem, extra: Partial<Parameters<typeof subirDeNivel>[1]> = {}) =>
  subirDeNivel(p, { pv: 5, ...extra })

function ateNivel(nivel: number): Personagem {
  let p = novo()
  while (p.nivel < nivel) {
    const req = requisitosDoProximoNivel(p)!
    p = subirMedia(p, {
      subclasseId: req.escolherSubclasse ? 'assassino' : undefined,
      incremento: req.incremento ? { des: 2 } : undefined,
      especializacoes: req.especializacoes ? ['acrobacia', 'ferramentasDeLadrao'] : undefined,
    })
  }
  return p
}

describe('elfo da floresta ladino, 1º nível', () => {
  const ficha = calcularFicha(novo())

  it('aplica os aumentos raciais (Des +2, Sab +1)', () => {
    expect(ficha.atributos.des.valor).toBe(17)
    expect(ficha.atributos.des.modificador).toBe(3)
    expect(ficha.atributos.sab.valor).toBe(14)
    expect(ficha.atributos.for.modificador).toBe(-1)
  })

  it('proficiência +2, iniciativa +3, deslocamento 10,5 m', () => {
    expect(ficha.proficiencia).toBe(2)
    expect(ficha.iniciativa).toBe(3)
    expect(ficha.deslocamento).toBe(10.5)
  })

  it('CA com armadura de couro equipada = 11 + Des', () => {
    expect(ficha.ca.valor).toBe(14)
  })

  it('PV no 1º nível = 8 + Con', () => {
    expect(ficha.pvMaximo).toBe(10)
    expect(novo().estado.pvAtual).toBe(10)
  })

  it('testes de resistência de Destreza e Inteligência', () => {
    expect(ficha.resistencias.des).toEqual({ proficiente: true, bonus: 5 })
    expect(ficha.resistencias.int).toEqual({ proficiente: true, bonus: 3 })
    expect(ficha.resistencias.sab).toEqual({ proficiente: false, bonus: 2 })
  })

  it('perícias de raça, antecedente e classe, com especialização', () => {
    const p = (id: string) => ficha.pericias.find((x) => x.id === id)!
    expect(p('percepcao')).toMatchObject({ grau: 1, bonus: 4 }) // Sentidos Aguçados
    expect(p('enganacao')).toMatchObject({ grau: 1, bonus: 2 }) // Criminoso
    expect(p('furtividade')).toMatchObject({ grau: 2, bonus: 7 }) // Criminoso + Especialização
    expect(p('prestidigitacao')).toMatchObject({ grau: 2, bonus: 7 })
    expect(p('acrobacia')).toMatchObject({ grau: 1, bonus: 5 })
    expect(p('atletismo')).toMatchObject({ grau: 0, bonus: -1 })
    expect(ficha.percepcaoPassiva).toBe(14)
  })

  it('ataques: rapieira e adaga usam Des (acuidade); arco curto usa Des', () => {
    const rapieira = ficha.ataques.find((a) => a.nome === 'Rapieira')!
    expect(rapieira).toMatchObject({ bonusAtaque: 5, dano: '1d8+3', atributo: 'des', proficiente: true, furtivo: true })
    const adaga = ficha.ataques.find((a) => a.nome === 'Adaga')!
    expect(adaga).toMatchObject({ bonusAtaque: 5, dano: '1d4+3' })
    const arco = ficha.ataques.find((a) => a.nome === 'Arco curto')!
    expect(arco).toMatchObject({ bonusAtaque: 5, dano: '1d6+3', alcance: '24/96 m' })
  })

  it('Ataque Furtivo 1d6 e habilidades de 1º nível', () => {
    expect(ficha.ataqueFurtivo).toBe('1d6')
    const nomes = ficha.habilidades.map((h) => h.nome)
    expect(nomes).toEqual(expect.arrayContaining(['Especialização', 'Ataque Furtivo', 'Gíria de Ladrão', 'Pés Ligeiros', 'Contato Criminal']))
    expect(nomes).not.toContain('Ação Ardilosa')
  })

  it('carga soma o inventário inicial', () => {
    expect(ficha.carga.peso).toBe(36.5)
    expect(ficha.carga.capacidade).toBe(60)
  })

  it('idiomas do elfo e ferramentas sem repetição', () => {
    expect(ficha.proficiencias.idiomas).toEqual(['Comum', 'Élfico'])
    expect(ficha.proficiencias.ferramentas.filter((f) => f === 'Ferramentas de ladrão')).toHaveLength(1)
    expect(ficha.proficiencias.armas).toEqual(expect.arrayContaining(['Armas simples', 'Rapieira', 'Arco longo']))
  })

  it('não é conjurador', () => {
    expect(ficha.conjuracao).toBeNull()
  })
})

describe('mudar um atributo atualiza tudo que depende dele', () => {
  it('Destreza mais alta sobe CA, iniciativa, ataques e perícias', () => {
    const p = { ...novo(), atributosBase: { ...novo().atributosBase, des: 13 } }
    const f = calcularFicha(p)
    expect(f.atributos.des.valor).toBe(15)
    expect(f.ca.valor).toBe(13)
    expect(f.iniciativa).toBe(2)
    expect(f.ataques.find((a) => a.nome === 'Rapieira')!.bonusAtaque).toBe(4)
  })

  it('sem armadura equipada a CA volta a 10 + Des', () => {
    const p = novo()
    const semArmadura = { ...p, inventario: p.inventario.map((i) => ({ ...i, equipado: false })) }
    expect(calcularFicha(semArmadura).ca.valor).toBe(13)
  })
})

describe('subida de nível', () => {
  it('2º nível: PV + 5 + Con e Ação Ardilosa', () => {
    const p = ateNivel(2)
    const f = calcularFicha(p)
    expect(f.pvMaximo).toBe(17)
    expect(p.estado.pvAtual).toBe(17)
    expect(f.habilidades.map((h) => h.nome)).toContain('Ação Ardilosa')
  })

  it('3º nível pede o arquétipo; Assassino dá Assassinar e kits', () => {
    const p2 = ateNivel(2)
    expect(requisitosDoProximoNivel(p2)!.escolherSubclasse).toBe(true)
    expect(() => subirMedia(p2)).toThrow('arquétipo')
    const f = calcularFicha(ateNivel(3))
    expect(f.ataqueFurtivo).toBe('2d6')
    expect(f.habilidades.map((h) => h.nome)).toEqual(expect.arrayContaining(['Assassinar', 'Proficiência Adicional']))
    expect(f.proficiencias.ferramentas).toEqual(expect.arrayContaining(['Kit de disfarce', 'Kit de venenos']))
  })

  it('4º nível: incremento de atributo atualiza a ficha', () => {
    const f = calcularFicha(ateNivel(4))
    expect(f.atributos.des.valor).toBe(19)
    expect(f.ca.valor).toBe(15)
    expect(f.pvMaximo).toBe(31)
  })

  it('5º nível: proficiência +3', () => {
    const f = calcularFicha(ateNivel(5))
    expect(f.proficiencia).toBe(3)
    expect(f.pericias.find((x) => x.id === 'furtividade')!.bonus).toBe(4 + 6)
  })

  it('6º nível: mais duas especializações', () => {
    const f = calcularFicha(ateNivel(6))
    expect(f.pericias.find((x) => x.id === 'acrobacia')!.grau).toBe(2)
  })

  it('incremento não passa de 20', () => {
    const f = calcularFicha(ateNivel(8))
    expect(f.atributos.des.valor).toBe(20)
  })

  it('15º nível: Mente Escorregadia dá resistência de Sabedoria', () => {
    expect(calcularFicha(ateNivel(15)).resistencias.sab.proficiente).toBe(true)
  })

  it('rejeita dado de vida fora do intervalo e incremento inválido', () => {
    expect(() => subirDeNivel(novo(), { pv: 9 })).toThrow()
    expect(incrementoValido({ des: 2 })).toBe(true)
    expect(incrementoValido({ des: 1, con: 1 })).toBe(true)
    expect(incrementoValido({ des: 1 })).toBe(false)
    expect(incrementoValido({ des: 3 })).toBe(false)
  })
})

describe('vida em jogo', () => {
  it('dano tira primeiro dos PV temporários', () => {
    let p = definirTemporario(novo(), 5)
    p = aplicarDano(p, 7)
    expect(p.estado).toMatchObject({ pvTemporario: 0, pvAtual: 8 })
  })
  it('PV não ficam negativos e cura não passa do máximo', () => {
    let p = aplicarDano(novo(), 50)
    expect(p.estado.pvAtual).toBe(0)
    p = curar(p, 99)
    expect(p.estado.pvAtual).toBe(10)
  })
  it('descanso curto gasta dados de vida (dado + Con)', () => {
    let p = aplicarDano(ateNivel(2), 10)
    p = descansoCurto(p, [3])
    expect(p.estado.pvAtual).toBe(7 + 3 + 2)
    expect(calcularFicha(p).dadosDeVidaRestantes).toBe(1)
  })
  it('descanso longo restaura PV, zera temporários e devolve metade dos dados', () => {
    let p = definirTemporario(aplicarDano(ateNivel(4), 20), 3)
    p = descansoCurto(p, [1, 1, 1])
    p = descansoLongo(p)
    expect(p.estado.pvAtual).toBe(31)
    expect(p.estado.pvTemporario).toBe(0)
    expect(calcularFicha(p).dadosDeVidaRestantes).toBe(3)
  })
  it('descanso longo exige ao menos 1 PV', () => {
    const p = aplicarDano(novo(), 99)
    expect(descansoLongo(p).estado.pvAtual).toBe(0)
  })
})

describe('criação', () => {
  it('compra de pontos: 27 pontos, valores entre 8 e 15', () => {
    expect(custoCompraPontos({ for: 15, des: 15, con: 15, int: 8, sab: 8, car: 8 })).toBe(27)
    expect(compraPontosValida({ for: 15, des: 15, con: 15, int: 9, sab: 8, car: 8 })).toBe(false)
    expect(custoCompraPontos({ for: 16, des: 8, con: 8, int: 8, sab: 8, car: 8 })).toBeNull()
  })
  it('4d6 descarta o menor', () => {
    const seq = [0.99, 0.0, 0.5, 0.5] // 6, 1, 4, 4
    let i = 0
    const r = rolar4d6(() => seq[i++]!)
    expect(r.dados).toEqual([6, 1, 4, 4])
    expect(r.total).toBe(14)
  })
  it('Criminoso e ladino repetem ferramentas de ladrão: vira uma escolha livre', () => {
    expect(ferramentasRepetidas('ladino', 'criminoso')).toEqual(['Ferramentas de ladrão'])
    expect(periciasRepetidas('elfo', 'elfo-floresta', 'criminoso')).toBe(0)
  })
  it('guarda a história e a personalidade, sem espaços sobrando', () => {
    const p = criarPersonagem({
      ...escolhas,
      historia: { objetivo: ' Achar a irmã ', tendencia: 'Caótico e Bom' },
      personalidade: { ideais: 'Liberdade' },
    })
    expect(p.historia).toMatchObject({ objetivo: 'Achar a irmã', tendencia: 'Caótico e Bom', idade: '' })
    expect(p.personalidade.ideais).toBe('Liberdade')
  })
  it('equipamento inicial com 15 po do antecedente e couro equipado', () => {
    const p = novo()
    expect(p.moedas.po).toBe(15)
    expect(p.inventario.find((i) => i.itemId === 'couro')!.equipado).toBe(true)
    expect(p.inventario.find((i) => i.itemId === 'peDeCabra')!.quantidade).toBe(2)
  })
})
