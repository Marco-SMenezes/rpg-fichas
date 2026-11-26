import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarPersonagem, type EscolhasDeCriacao } from '../regras/dnd5e/motor/criacao'
import { calcularFicha } from '../regras/dnd5e/motor/ficha'
import { ajustarPV } from '../regras/dnd5e/motor/progressao'
import type { Personagem } from '../regras/dnd5e/tipos'

const nuvemCombate = vi.hoisted(() => ({
  meusParticipantes: vi.fn(),
  atualizarMeuParticipante: vi.fn(),
  meusAjustesPendentes: vi.fn(),
  pegarAjuste: vi.fn(),
}))
vi.mock('../nuvem/combate', () => nuvemCombate)
vi.mock('../nuvem/nuvem', () => ({ nuvem: { ler: () => ({ status: 'logado', aprovado: true }) } }))

import { aoRolarIniciativa, aplicarAjustesPendentes, configurarPonte, vidaParaEnviar } from './ponte'

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

let fichas: Personagem[]
const salvar = vi.fn((p: Personagem) => {
  fichas = fichas.map((x) => (x.id === p.id ? p : x))
  return p
})

beforeEach(() => {
  vi.clearAllMocks()
  fichas = [{ ...criarPersonagem(escolhas), id: 'pj-1' }]
  configurarPonte({
    listarPersonagens: () => fichas,
    salvarPersonagem: salvar,
    listarFichasLivres: () => [],
    salvarFichaLivre: (f) => f,
    listarModelos: () => [],
  })
  nuvemCombate.meusParticipantes.mockResolvedValue([{ id: 'part-1', personagem_id: 'pj-1', tipo: 'jogador' }])
})

describe('ponte ficha ↔ combate', () => {
  it('manda vida atual, máxima e temporária', () => {
    const g = fichas[0]!
    const max = calcularFicha(g).pvMaximo
    const ferido = { ...ajustarPV(g, -(max - 8)) }
    const comTemp = { ...ferido, estado: { ...ferido.estado, pvTemporario: 3 } }
    expect(vidaParaEnviar(comTemp)).toEqual({ pv: 8, pv_max: max, pv_temp: 3 })
  })

  it('ajuste pego por outro aparelho não é aplicado de novo', async () => {
    const max = calcularFicha(fichas[0]!).pvMaximo
    nuvemCombate.meusAjustesPendentes.mockResolvedValue([
      { id: 1, participante_id: 'part-1', delta: -2 },
      { id: 2, participante_id: 'part-1', delta: -3 },
    ])
    nuvemCombate.pegarAjuste.mockResolvedValueOnce(-2).mockResolvedValueOnce(null)
    expect(await aplicarAjustesPendentes()).toBe(1)
    expect(fichas[0]!.estado.pvAtual).toBe(max - 2)
  })

  it('iniciativa rolada na ficha vai para o combate', async () => {
    await aoRolarIniciativa('pj-1', 17)
    expect(nuvemCombate.atualizarMeuParticipante).toHaveBeenCalledWith('part-1', { iniciativa: 17 })
  })

  it('ajuste que chega durante outra aplicação não espera a próxima sincronização', async () => {
    let soltar: (v: unknown[]) => void = () => {}
    nuvemCombate.meusAjustesPendentes.mockImplementationOnce(() => new Promise((r) => (soltar = r))).mockResolvedValue([])
    const primeira = aplicarAjustesPendentes()
    const segunda = aplicarAjustesPendentes()
    soltar([])
    await Promise.all([primeira, segunda])
    await new Promise((r) => setTimeout(r, 0))
    expect(nuvemCombate.meusAjustesPendentes).toHaveBeenCalledTimes(2)
  })
})
