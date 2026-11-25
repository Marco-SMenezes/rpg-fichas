import { VALORES_PADRAO } from '../../../regras/dnd5e/dados/atributos'
import type { EscolhasDeCriacao } from '../../../regras/dnd5e/motor/criacao'
import type { Atributo, ValoresAtributos } from '../../../regras/dnd5e/tipos'

export type Atribuicao = Record<Atributo, number | null>

export interface Rascunho extends Omit<EscolhasDeCriacao, 'atributosBase'> {
  passo: number
  compra: ValoresAtributos
  /** Totais de 4d6 com os dados de cada rolagem. */
  rolagens: { dados: number[]; total: number }[]
  /** Para valores padrão e rolagem: índice do valor do conjunto usado em cada atributo. */
  atribuicao: Atribuicao
}

const VAZIA: Atribuicao = { for: null, des: null, con: null, int: null, sab: null, car: null }

export function rascunhoInicial(): Rascunho {
  return {
    passo: 0,
    nome: '',
    conceito: '',
    jogador: '',
    racaId: 'elfo',
    subracaId: 'elfo-floresta',
    classeId: 'ladino',
    antecedenteId: 'criminoso',
    metodoAtributos: 'compra',
    compra: { for: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 },
    rolagens: [],
    atribuicao: { ...VAZIA },
    periciasEscolhidas: [],
    especializacoes: [],
    ferramentasEscolhidas: [],
    idiomasEscolhidos: [],
    equipamento: {},
  }
}

export function conjuntoDeValores(r: Rascunho): number[] {
  return r.metodoAtributos === 'rolagem' ? r.rolagens.map((x) => x.total) : VALORES_PADRAO
}

/** Atributos base a partir do método escolhido; null se faltar atribuir algum. */
export function atributosBase(r: Rascunho): ValoresAtributos | null {
  if (r.metodoAtributos === 'compra') return r.compra
  const valores = conjuntoDeValores(r)
  const base = {} as ValoresAtributos
  for (const [atributo, indice] of Object.entries(r.atribuicao) as [Atributo, number | null][]) {
    if (indice === null || valores[indice] === undefined) return null
    base[atributo] = valores[indice]
  }
  return base
}

const CHAVE = 'tomo:rascunho:v1'

export function lerRascunho(): Rascunho {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (bruto) return { ...rascunhoInicial(), ...(JSON.parse(bruto) as Partial<Rascunho>) }
  } catch {
    /* rascunho ilegível: começa do zero */
  }
  return rascunhoInicial()
}

export function gravarRascunho(r: Rascunho | null) {
  try {
    if (r) localStorage.setItem(CHAVE, JSON.stringify(r))
    else localStorage.removeItem(CHAVE)
  } catch {
    /* sem armazenamento */
  }
}
