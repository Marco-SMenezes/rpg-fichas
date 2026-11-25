import { useEffect, useState } from 'react'

export type Rota =
  | { nome: 'lista' }
  | { nome: 'criacao' }
  | { nome: 'ficha'; id: string; aba: string | null }
  | { nome: 'nao-encontrada' }

export function lerRota(hash: string): Rota {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  if (partes.length === 0) return { nome: 'lista' }
  if (partes[0] === 'novo') return { nome: 'criacao' }
  if (partes[0] === 'p' && partes[1]) return { nome: 'ficha', id: partes[1], aba: partes[2] ?? null }
  return { nome: 'nao-encontrada' }
}

export const caminho = {
  lista: () => '#/',
  criacao: () => '#/novo',
  ficha: (id: string, aba?: string) => `#/p/${encodeURIComponent(id)}${aba ? `/${aba}` : ''}`,
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
