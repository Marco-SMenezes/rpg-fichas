import { useEffect, useState } from 'react'

export type AbaDaCampanha = 'combate' | 'escudo' | 'trilhas'

export type Rota =
  | { nome: 'lista' }
  | { nome: 'criacao' }
  | { nome: 'ficha'; id: string; aba: string | null }
  | { nome: 'campanhas' }
  | { nome: 'dados' }
  | { nome: 'contas' }
  | { nome: 'compendio' }
  | { nome: 'modelos' }
  | { nome: 'bestiario' }
  | { nome: 'monstro'; id: string }
  | { nome: 'modelo'; id: string }
  | { nome: 'livre'; id: string }
  | { nome: 'campanha'; id: string; aba: AbaDaCampanha | null }
  | { nome: 'ficha-mesa'; campanhaId: string; personagemId: string }
  | { nome: 'nao-encontrada' }

export function lerRota(hash: string): Rota {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  if (partes.length === 0) return { nome: 'lista' }
  if (partes[0] === 'novo') return { nome: 'criacao' }
  if (partes[0] === 'p' && partes[1]) return { nome: 'ficha', id: partes[1], aba: partes[2] ?? null }
  if (partes[0] === 'campanhas') return { nome: 'campanhas' }
  if (partes[0] === 'dados') return { nome: 'dados' }
  if (partes[0] === 'contas') return { nome: 'contas' }
  if (partes[0] === 'compendio') return { nome: 'compendio' }
  if (partes[0] === 'modelos') return { nome: 'modelos' }
  if (partes[0] === 'bestiario') return { nome: 'bestiario' }
  if (partes[0] === 'monstro' && partes[1]) return { nome: 'monstro', id: partes[1] }
  if (partes[0] === 'modelo' && partes[1]) return { nome: 'modelo', id: partes[1] }
  if (partes[0] === 'livre' && partes[1]) return { nome: 'livre', id: partes[1] }
  if (partes[0] === 'c' && partes[1] && partes[2] === 'p' && partes[3]) return { nome: 'ficha-mesa', campanhaId: partes[1], personagemId: partes[3] }
  if (partes[0] === 'c' && partes[1])
    return { nome: 'campanha', id: partes[1], aba: partes[2] === 'combate' || partes[2] === 'escudo' || partes[2] === 'trilhas' ? partes[2] : null }
  return { nome: 'nao-encontrada' }
}

export const caminho = {
  lista: () => '#/',
  criacao: () => '#/novo',
  ficha: (id: string, aba?: string) => `#/p/${encodeURIComponent(id)}${aba ? `/${aba}` : ''}`,
  campanhas: () => '#/campanhas',
  dados: () => '#/dados',
  contas: () => '#/contas',
  compendio: () => '#/compendio',
  modelos: () => '#/modelos',
  bestiario: () => '#/bestiario',
  monstro: (id: string) => `#/monstro/${encodeURIComponent(id)}`,
  modelo: (id: string) => `#/modelo/${encodeURIComponent(id)}`,
  livre: (id: string) => `#/livre/${encodeURIComponent(id)}`,
  campanha: (id: string, aba?: AbaDaCampanha) => `#/c/${encodeURIComponent(id)}${aba ? `/${aba}` : ''}`,
  fichaMesa: (campanhaId: string, personagemId: string) => `#/c/${encodeURIComponent(campanhaId)}/p/${encodeURIComponent(personagemId)}`,
}

export function irPara(destino: string, substituir = false): void {
  if (substituir) window.location.replace(destino)
  else window.location.hash = destino
}

/** Roteamento por hash: funciona igual no GitHub Pages e na Vercel. */
export function useRota(): Rota {
  const [rota, setRota] = useState(() => lerRota(window.location.hash))
  useEffect(() => {
    const aoMudar = () => {
      setRota(lerRota(window.location.hash))
    }
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])
  return rota
}
