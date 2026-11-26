/** Monstros do bestiário: os do SRD 5.1 (traduzidos) e os criados pelo mestre. */
import type { Atributo } from '../../tipos'

export interface TextoDeMonstro {
  nome: string
  texto: string
}

export interface Monstro {
  id: string
  nome: string
  /** Nome em inglês (SRD), para a busca. */
  nomeOriginal: string
  tamanho: string
  tipo: string
  subtipo: string
  tendencia: string
  ca: number
  caDescricao: string
  pv: number
  dadosDeVida: string
  deslocamento: string
  atributos: Record<Atributo, number>
  salvaguardas: Partial<Record<Atributo, number>>
  pericias: { nome: string; bonus: number }[]
  vulnerabilidades: string
  resistencias: string
  imunidades: string
  imunidadesACondicao: string
  sentidos: string
  idiomas: string
  nd: string
  xp: number
  tracos: TextoDeMonstro[]
  acoes: TextoDeMonstro[]
  acoesBonus: TextoDeMonstro[]
  reacoes: TextoDeMonstro[]
  lendarias: TextoDeMonstro[]
  descricaoLendaria: string
  foto?: string
  origem: 'srd' | 'meu'
  criadoEm: string
  atualizadoEm: string
}

export const TIPOS_DE_MONSTRO = [
  'Aberração',
  'Besta',
  'Celestial',
  'Constructo',
  'Dragão',
  'Elemental',
  'Fada',
  'Corruptor',
  'Gigante',
  'Humanoide',
  'Monstruosidade',
  'Limo',
  'Planta',
  'Morto-vivo',
]
