import { describe, expect, it } from 'vitest'
import { criarPersonagem, type EscolhasDeCriacao } from '../regras/dnd5e/motor/criacao'
import { calcularFicha } from '../regras/dnd5e/motor/ficha'
import { atualDoRecurso, modeloDeExemplo, valoresIniciais, type FichaLivre } from '../universal/modelo'
import {
  ajustarVidaLivre,
  ajustarVidaSimples,
  aplicarDeltas,
  nomesNumerados,
  ordenarParticipantes,
  proximoTurno,
  resumoDoPersonagem,
  rolarPV,
  vezDepoisDeRemover,
  vidaDaFichaLivre,
} from './regras'

const p = (nome: string, iniciativa: number | null, desempate = 0) => ({ id: nome, nome, iniciativa, desempate })

describe('ordem de iniciativa', () => {
  it('maior iniciativa primeiro, desempate pela Destreza, sem iniciativa no fim', () => {
    const o = ordenarParticipantes([p('A', 12, 1), p('B', 18), p('C', 12, 3), p('D', null, 9)])
    expect(o.map((x) => x.nome)).toEqual(['B', 'C', 'A', 'D'])
  })
  it('empate total: nome em ordem natural', () => {
    expect(ordenarParticipantes([p('Goblin 10', 15, 2), p('Goblin 2', 15, 2)]).map((x) => x.nome)).toEqual(['Goblin 2', 'Goblin 10'])
  })
})

describe('turno', () => {
  const ordem = [p('B', 18), p('C', 12), p('A', 10)]
  it('passa para o próximo e, do último, volta ao topo com rodada nova', () => {
    expect(proximoTurno(ordem, 'B', 1)).toEqual({ vez: 'C', rodada: 1 })
    expect(proximoTurno(ordem, 'A', 1)).toEqual({ vez: 'B', rodada: 2 })
    expect(proximoTurno(ordem, null, 1)).toEqual({ vez: 'B', rodada: 1 })
    expect(proximoTurno([], 'B', 3)).toEqual({ vez: null, rodada: 3 })
  })
  it('remover quem está na vez passa a vez adiante', () => {
    expect(vezDepoisDeRemover(ordem, 'C', 'C')).toBe('A')
    expect(vezDepoisDeRemover(ordem, 'A', 'A')).toBe('B')
    expect(vezDepoisDeRemover(ordem, 'B', 'C')).toBe('B')
    expect(vezDepoisDeRemover([p('B', 1)], 'B', 'B')).toBeNull()
  })
})

describe('nomes dos monstros', () => {
  it('numera e continua a numeração da mesa', () => {
    expect(nomesNumerados('Goblin', 3, [])).toEqual(['Goblin 1', 'Goblin 2', 'Goblin 3'])
    expect(nomesNumerados('Goblin', 2, ['Goblin 1', 'Goblin 2'])).toEqual(['Goblin 3', 'Goblin 4'])
    expect(nomesNumerados('Ogro', 1, [])).toEqual(['Ogro'])
    expect(nomesNumerados('Ogro', 1, ['Ogro'])).toEqual(['Ogro 2'])
  })
})

describe('PV rolado', () => {
  it('rola os dados de vida ou usa a média', () => {
    expect(rolarPV('2d6', 7, () => 0)).toBe(2)
    expect(rolarPV('2d6', 7, () => 0.999)).toBe(12)
    expect(rolarPV('2d8+4', 13, () => 0)).toBe(6)
    expect(rolarPV('', 7)).toBe(7)
  })
})

const escolhas: EscolhasDeCriacao = {
  nome: 'T',
  conceito: '',
  jogador: '',
  racaId: 'humano',
  subracaId: null,
  classeId: 'guerreiro',
  antecedenteId: 'soldado',
  metodoAtributos: 'manual',
  atributosBase: { for: 15, des: 13, con: 14, int: 10, sab: 12, car: 8 },
  periciasEscolhidas: ['atletismo', 'percepcao'],
  especializacoes: [],
  ferramentasEscolhidas: [],
  idiomasEscolhidos: [],
  equipamento: {},
  escolhasDeClasse: { estiloDeLuta: 'defesa' },
}

describe('vida', () => {
  it('ajustes do mestre aplicados em ordem na ficha', () => {
    const g = criarPersonagem(escolhas)
    const max = calcularFicha(g).pvMaximo
    expect(aplicarDeltas(g, [-5, -3]).estado.pvAtual).toBe(max - 8)
    expect(resumoDoPersonagem(g)).toMatch(/Humano · Guerreiro 1/)
  })
  it('ficha livre usa o primeiro recurso', () => {
    const modelo = modeloDeExemplo()
    const f: FichaLivre = { id: 'livre-1', modeloId: modelo.id, nome: 'Kai', valores: valoresIniciais(modelo), criadoEm: 'x', atualizadoEm: 'x' }
    const v = vidaDaFichaLivre(modelo, f)!
    expect(v.max).toBeGreaterThan(0)
    const recurso = modelo.campos.find((c) => c.tipo === 'recurso')!
    expect(atualDoRecurso(recurso, ajustarVidaLivre(modelo, f, -100).valores)).toBe(0)
    expect(vidaDaFichaLivre(modelo, ajustarVidaLivre(modelo, ajustarVidaLivre(modelo, f, -100), 999))!.pv).toBe(v.max)
  })
})

describe('vida simples (monstros e prévia)', () => {
  it('dano tira primeiro do temporário, cura até o máximo, o resto vira temporário', () => {
    expect(ajustarVidaSimples({ pv: 7, pv_max: 7, pv_temp: 2 }, -3)).toEqual({ pv: 6, pv_max: 7, pv_temp: 0 })
    expect(ajustarVidaSimples({ pv: 2, pv_max: 7, pv_temp: 0 }, -5)).toEqual({ pv: 0, pv_max: 7, pv_temp: 0 })
    expect(ajustarVidaSimples({ pv: 5, pv_max: 7, pv_temp: 0 }, 4)).toEqual({ pv: 7, pv_max: 7, pv_temp: 2 })
  })
})
