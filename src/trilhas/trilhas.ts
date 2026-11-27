/** Trilhas sonoras da campanha: cenas com faixas de YouTube e Spotify (só o mestre vê). */
import { novoId } from '../universal/modelo'

export type Servico = 'youtube' | 'spotify' | 'link'

export interface Faixa {
  id: string
  nome: string
  url: string
  servico: Servico
  /** YouTube: id do vídeo ou `playlist:ID`. Spotify: `tipo:ID` (track, album, playlist, episode, show). Link: vazio. */
  recurso: string
}

export interface Cena {
  id: string
  nome: string
  faixas: Faixa[]
}

export interface Trilhas {
  cenas: Cena[]
}

const SPOTIFY = /^(track|album|playlist|episode|show|artist)$/
const ID_YOUTUBE = /^[\w-]{6,}$/

/** Descobre o serviço e o recurso de um link colado. Qualquer coisa estranha vira `link`, nunca dá erro. */
export function reconhecerLink(url: string): { servico: Servico; recurso: string } {
  const outro = { servico: 'link' as const, recurso: '' }
  const texto = (url ?? '').trim()
  const uri = /^spotify:(\w+):([A-Za-z0-9]+)$/.exec(texto)
  if (uri && SPOTIFY.test(uri[1]!)) return { servico: 'spotify', recurso: `${uri[1]}:${uri[2]}` }
  let u: URL
  try {
    u = new URL(texto)
  } catch {
    return outro
  }
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0] ?? ''
    return ID_YOUTUBE.test(id) ? { servico: 'youtube', recurso: id } : outro
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const lista = u.searchParams.get('list')
    if (lista && ID_YOUTUBE.test(lista)) return { servico: 'youtube', recurso: `playlist:${lista}` }
    const v = u.searchParams.get('v')
    if (v && ID_YOUTUBE.test(v)) return { servico: 'youtube', recurso: v }
    return outro
  }
  if (host === 'open.spotify.com') {
    const partes = u.pathname.split('/').filter(Boolean)
    const sem = partes[0]?.startsWith('intl-') ? partes.slice(1) : partes
    if (sem[0] && SPOTIFY.test(sem[0]) && sem[1] && /^[A-Za-z0-9]+$/.test(sem[1])) return { servico: 'spotify', recurso: `${sem[0]}:${sem[1]}` }
  }
  return outro
}

function nomePadrao(url: string): string {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '')
  } catch {
    return 'Faixa'
  }
}

export function novaFaixa(url: string, nome?: string): Faixa {
  const { servico, recurso } = reconhecerLink(url)
  return { id: novoId('faixa'), nome: nome?.trim() || nomePadrao(url), url: url.trim(), servico, recurso }
}

export function novaCena(nome: string): Cena {
  return { id: novoId('cena'), nome: nome.trim() || 'Cena', faixas: [] }
}

const objeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** Lê o que veio da nuvem (ou de um rascunho antigo) sem confiar no formato. */
export function normalizarTrilhas(bruto: unknown): Trilhas {
  if (!objeto(bruto) || !Array.isArray(bruto.cenas)) return { cenas: [] }
  const cenas: Cena[] = []
  for (const c of bruto.cenas) {
    if (!objeto(c)) continue
    const faixas: Faixa[] = []
    for (const f of Array.isArray(c.faixas) ? c.faixas : []) {
      if (!objeto(f) || typeof f.url !== 'string' || !f.url.trim()) continue
      const base = novaFaixa(f.url, typeof f.nome === 'string' ? f.nome : undefined)
      faixas.push({ ...base, id: typeof f.id === 'string' && f.id ? f.id : base.id })
    }
    cenas.push({
      id: typeof c.id === 'string' && c.id ? c.id : novoId('cena'),
      nome: typeof c.nome === 'string' && c.nome.trim() ? c.nome.trim() : 'Cena',
      faixas,
    })
  }
  return { cenas }
}

/** Troca a posição de um item, sem mexer na lista original; índices fora da lista não fazem nada. */
export function moverItem<T>(lista: T[], de: number, para: number): T[] {
  if (de < 0 || de >= lista.length || para < 0 || para >= lista.length || de === para) return lista.slice()
  const copia = lista.slice()
  const [item] = copia.splice(de, 1)
  copia.splice(para, 0, item as T)
  return copia
}

export function tamanhoDasTrilhas(t: Trilhas): number {
  return new TextEncoder().encode(JSON.stringify(t)).length
}

/** O banco aceita até 100 KB (migração 0020). */
export const LIMITE_DAS_TRILHAS = 100000
