import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LayoutsSalvos, Personagem } from '../../../regras/dnd5e/tipos'
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

const chaveAntiga = (personagemId: string) => `tomo:layout:v1:${personagemId}`

/** Layout que ficava só no aparelho (antes de ir junto com a ficha). */
function lerAntigo(personagemId: string): LayoutsSalvos | null {
  try {
    const bruto = localStorage.getItem(chaveAntiga(personagemId))
    const x: unknown = bruto ? JSON.parse(bruto) : null
    return x && typeof x === 'object' && !Array.isArray(x) ? (x as LayoutsSalvos) : null
  } catch {
    return null
  }
}

function apagarAntigo(personagemId: string) {
  try {
    localStorage.removeItem(chaveAntiga(personagemId))
  } catch {
    /* nada a apagar */
  }
}

/**
 * Layout da ficha nesta tela. Fica dentro da própria ficha, então sobe para a
 * conta e vale em todos os aparelhos (celular e computador têm layouts separados).
 */
export function useLayout(p: Personagem, atualizar: (p: Personagem) => void, blocos: DefinicaoBloco[], tela: Tela, somenteLeitura = false) {
  // Traz para dentro da ficha o layout que estava salvo só neste aparelho.
  useEffect(() => {
    if (somenteLeitura || p.layout) return
    const antigo = lerAntigo(p.id)
    if (antigo) atualizar({ ...p, layout: antigo })
    apagarAntigo(p.id)
    // Só na abertura da ficha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id])

  const salvo = useMemo(() => p.layout ?? {}, [p.layout])
  const layout = useMemo(() => normalizarLayout(salvo[tela], blocos, tela), [salvo, blocos, tela])

  const definir = useCallback(
    (novo: Layout | null) => {
      const proximo: LayoutsSalvos = { ...p.layout }
      if (novo) proximo[tela] = novo
      else delete proximo[tela]
      atualizar({ ...p, layout: Object.keys(proximo).length ? proximo : undefined })
    },
    [p, atualizar, tela],
  )

  const personalizado = salvo[tela] !== undefined
  return { layout, definir, restaurar: () => definir(null), personalizado, padrao: layoutPadrao(blocos, tela) }
}
