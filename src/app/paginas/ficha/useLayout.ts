import { useCallback, useEffect, useMemo, useState } from 'react'
import { layoutPadrao, normalizarLayout, type DefinicaoBloco, type Layout, type Tela } from '../../../layout/layout'

const LARGA = '(min-width: 720px)'

export function useTela(): Tela {
  const consulta = () => (typeof window !== 'undefined' && window.matchMedia(LARGA).matches ? 'larga' : 'estreita')
  const [tela, setTela] = useState<Tela>(consulta)
  useEffect(() => {
    const m = window.matchMedia(LARGA)
    const aoMudar = () => setTela(m.matches ? 'larga' : 'estreita')
    m.addEventListener('change', aoMudar)
    return () => m.removeEventListener('change', aoMudar)
  }, [])
  return tela
}

const chave = (personagemId: string) => `tomo:layout:v1:${personagemId}`

function ler(personagemId: string): Partial<Record<Tela, unknown>> {
  try {
    const bruto = localStorage.getItem(chave(personagemId))
    return bruto ? (JSON.parse(bruto) as Partial<Record<Tela, unknown>>) : {}
  } catch {
    return {}
  }
}

/**
 * Layout da ficha deste personagem nesta tela. Fica no localStorage, então
 * cada aparelho guarda a própria organização.
 */
export function useLayout(personagemId: string, blocos: DefinicaoBloco[], tela: Tela) {
  const [salvo, setSalvo] = useState(() => ler(personagemId))
  const layout = useMemo(() => normalizarLayout(salvo[tela], blocos, tela), [salvo, blocos, tela])

  const definir = useCallback(
    (novo: Layout | null) => {
      setSalvo((atual) => {
        const proximo = { ...atual }
        if (novo) proximo[tela] = novo
        else delete proximo[tela]
        try {
          localStorage.setItem(chave(personagemId), JSON.stringify(proximo))
        } catch {
          /* sem armazenamento: vale só nesta visita */
        }
        return proximo
      })
    },
    [personagemId, tela],
  )

  const personalizado = salvo[tela] !== undefined
  return { layout, definir, restaurar: () => definir(null), personalizado, padrao: layoutPadrao(blocos, tela) }
}
