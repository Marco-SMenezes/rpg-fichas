/** Regras puras do bestiário: nível de desafio, normalização e busca. */
import { novoId } from '../../../../universal/modelo'
import type { Atributo } from '../../tipos'
import type { Monstro, TextoDeMonstro } from './tipos'

export const ATRIBUTOS_DE_MONSTRO: Atributo[] = ['for', 'des', 'con', 'int', 'sab', 'car']

/** "1/8" → 0,125; "10" → 10; inválido → 0. */
export function ndComoNumero(nd: string): number {
  const [a, b] = nd.split('/').map((x) => Number(x.trim()))
  if (b !== undefined) return a !== undefined && b ? a / b : 0
  return Number.isFinite(a) ? (a ?? 0) : 0
}

const XP: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000,
}

export function xpDoNd(nd: string): number {
  return XP[nd.trim()] ?? 0
}

const texto = (x: unknown, padrao = '') => (typeof x === 'string' ? x : padrao)
const numero = (x: unknown, padrao: number) => (typeof x === 'number' && Number.isFinite(x) ? x : padrao)
const textos = (x: unknown): TextoDeMonstro[] =>
  Array.isArray(x) ? x.filter((t) => t && typeof t === 'object').map((t) => ({ nome: texto(t.nome), texto: texto(t.texto) })) : []

export function normalizarMonstro(x: unknown, origem: 'srd' | 'meu'): Monstro | null {
  if (!x || typeof x !== 'object') return null
  const d = x as Record<string, unknown>
  const nome = texto(d.nome).trim()
  if (!nome) return null
  const atr = (d.atributos ?? {}) as Record<string, unknown>
  const sal = (d.salvaguardas ?? {}) as Record<string, unknown>
  const agora = new Date().toISOString()
  const nd = texto(d.nd, '0')
  const id = texto(d.id) || (origem === 'meu' ? novoId('monstro') : `srd-${nome.toLowerCase().replace(/\s+/g, '-')}`)
  const m: Monstro = {
    id,
    nome,
    nomeOriginal: texto(d.nomeOriginal),
    tamanho: texto(d.tamanho, 'Médio'),
    tipo: texto(d.tipo),
    subtipo: texto(d.subtipo),
    tendencia: texto(d.tendencia),
    ca: numero(d.ca, 10),
    caDescricao: texto(d.caDescricao),
    pv: numero(d.pv, 1),
    dadosDeVida: texto(d.dadosDeVida),
    deslocamento: texto(d.deslocamento, '9 m'),
    atributos: Object.fromEntries(ATRIBUTOS_DE_MONSTRO.map((a) => [a, numero(atr[a], 10)])) as Record<Atributo, number>,
    salvaguardas: Object.fromEntries(ATRIBUTOS_DE_MONSTRO.filter((a) => typeof sal[a] === 'number').map((a) => [a, sal[a] as number])),
    pericias: Array.isArray(d.pericias)
      ? d.pericias.filter((p) => p && typeof p === 'object').map((p) => ({ nome: texto(p.nome), bonus: numero(p.bonus, 0) }))
      : [],
    vulnerabilidades: texto(d.vulnerabilidades),
    resistencias: texto(d.resistencias),
    imunidades: texto(d.imunidades),
    imunidadesACondicao: texto(d.imunidadesACondicao),
    sentidos: texto(d.sentidos),
    idiomas: texto(d.idiomas),
    nd,
    xp: numero(d.xp, xpDoNd(nd)),
    tracos: textos(d.tracos),
    acoes: textos(d.acoes),
    acoesBonus: textos(d.acoesBonus),
    reacoes: textos(d.reacoes),
    lendarias: textos(d.lendarias),
    descricaoLendaria: texto(d.descricaoLendaria),
    origem,
    criadoEm: texto(d.criadoEm, agora),
    atualizadoEm: texto(d.atualizadoEm, agora),
  }
  if (typeof d.foto === 'string' && d.foto.startsWith('data:image/')) m.foto = d.foto
  return m
}

/** Minúsculas, sem acento, hífen vira espaço. */
const simples = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/-/g, ' ')

export interface FiltroDeMonstros {
  termo: string
  tipo: string
  ndMin: number | null
  ndMax: number | null
}

export { TIPOS_DE_MONSTRO } from './tipos'

export function filtrarMonstros(lista: Monstro[], f: FiltroDeMonstros): Monstro[] {
  const termo = simples(f.termo.trim())
  return lista
    .filter((m) => !termo || simples(m.nome).includes(termo) || simples(m.nomeOriginal).includes(termo))
    .filter((m) => !f.tipo || m.tipo === f.tipo)
    .filter((m) => f.ndMin === null || ndComoNumero(m.nd) >= f.ndMin)
    .filter((m) => f.ndMax === null || ndComoNumero(m.nd) <= f.ndMax)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
