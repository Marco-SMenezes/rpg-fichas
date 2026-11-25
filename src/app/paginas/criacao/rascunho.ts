import { VALORES_PADRAO } from '../../../regras/dnd5e/dados/atributos'
import { HISTORIA_VAZIA, PERSONALIDADE_VAZIA } from '../../../regras/dnd5e/dados/historia'
import type { EscolhasDeCriacao } from '../../../regras/dnd5e/motor/criacao'
import { ESCOLHAS_RACIAIS_VAZIAS } from '../../../regras/dnd5e/motor/criacao'
import type { Atributo, EscolhasRaciais, Especializavel, Historia, Personalidade, ValoresAtributos } from '../../../regras/dnd5e/tipos'

export type Atribuicao = Record<Atributo, number | null>

export interface Rascunho extends Omit<EscolhasDeCriacao, 'atributosBase' | 'historia' | 'personalidade' | 'escolhasRaciais'> {
  escolhasRaciais: EscolhasRaciais
  historia: Historia
  personalidade: Personalidade
  /** Nível inicial (campanhas que começam acima do 1º). */
  nivel: number
  /** PV dos níveis acima do 1º: valor fixo ou rolagem. */
  pvModo: 'media' | 'rolar'
  /** Resultado do dado de vida por nível; índice 0 = 2º nível. */
  pvRolagens: number[]
  subclasseId: string | null
  /** Incremento de atributo escolhido em cada nível que dá incremento. */
  incrementos: Record<string, Partial<ValoresAtributos>>
  /** Especializações ganhas acima do 1º nível (ladino: 6º). */
  especializacoesExtras: Especializavel[]
  passo: number
  /** Passo mais adiantado que o jogador já alcançou. */
  alcancado: number
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
    alcancado: 0,
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
    historia: { ...HISTORIA_VAZIA },
    personalidade: { ...PERSONALIDADE_VAZIA },
    escolhasRaciais: { ...ESCOLHAS_RACIAIS_VAZIAS },
    nivel: 1,
    pvModo: 'media',
    pvRolagens: [],
    subclasseId: null,
    incrementos: {},
    especializacoesExtras: [],
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
    if (bruto) {
      const inicial = rascunhoInicial()
      const salvo = JSON.parse(bruto) as Partial<Rascunho>
      return {
        ...inicial,
        ...salvo,
        historia: { ...inicial.historia, ...salvo.historia },
        personalidade: { ...inicial.personalidade, ...salvo.personalidade },
        escolhasRaciais: { ...inicial.escolhasRaciais, ...salvo.escolhasRaciais },
      }
    }
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
