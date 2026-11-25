/**
 * Regras puras da sincronização aparelho ⇄ nuvem (Etapa 2).
 *
 * Cada ficha tem `atualizadoEm`. Para cada id, a versão mais recente vence,
 * seja ela uma ficha, seja uma exclusão. Exclusões feitas no aparelho ficam
 * guardadas como "lápides" (id → data) até chegarem à nuvem; na nuvem, a
 * linha fica com `excluido = true` para os outros aparelhos também apagarem.
 */
import type { Personagem } from '../regras/dnd5e/tipos'

/** Linha da tabela `personagens` no Supabase (sem a coluna `dono`, que o banco preenche). */
export interface Linha {
  id: string
  dados: Personagem | null
  atualizado_em: string
  excluido: boolean
}

/** Lápides: id da ficha excluída → quando foi excluída. */
export type Exclusoes = Record<string, string>

export interface ResultadoMescla {
  /** Lista local depois de aplicar o que veio da nuvem. */
  locais: Personagem[]
  /** Linhas a gravar na nuvem (fichas novas, alteradas ou excluídas aqui). */
  enviar: Linha[]
  /** Ids alterados localmente por causa da nuvem. */
  alteradosAqui: string[]
}

interface Versao {
  quando: number
  ficha: Personagem | null
}

function tempo(iso: string): number {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

export function linhaDe(p: Personagem): Linha {
  return { id: p.id, dados: p, atualizado_em: p.atualizadoEm, excluido: false }
}

export function linhaExcluida(id: string, quando: string): Linha {
  return { id, dados: null, atualizado_em: quando, excluido: true }
}

/**
 * Junta as fichas do aparelho com as da nuvem. Não mexe em nada: devolve a nova
 * lista local e o que precisa subir. Empate de data não muda nada.
 */
export function mesclar(locais: Personagem[], exclusoes: Exclusoes, remotos: Linha[]): ResultadoMescla {
  const aqui = new Map<string, Versao>()
  for (const [id, quando] of Object.entries(exclusoes)) aqui.set(id, { quando: tempo(quando), ficha: null })
  for (const p of locais) {
    const lapide = aqui.get(p.id)
    // Uma ficha com o mesmo id de uma lápide só existe se foi recriada depois.
    if (!lapide || tempo(p.atualizadoEm) >= lapide.quando) aqui.set(p.id, { quando: tempo(p.atualizadoEm), ficha: p })
  }
  const la = new Map<string, Versao>()
  for (const r of remotos) la.set(r.id, { quando: tempo(r.atualizado_em), ficha: r.excluido ? null : r.dados })

  const enviar: Linha[] = []
  const alteradosAqui: string[] = []
  const vindas: Personagem[] = []
  const removidas = new Set<string>()
  const trocadas = new Map<string, Personagem>()

  for (const id of new Set([...aqui.keys(), ...la.keys()])) {
    const a = aqui.get(id)
    const r = la.get(id)
    if (a && (!r || a.quando > r.quando)) {
      // O aparelho tem a versão mais nova. Exclusão de algo que nunca subiu não precisa ir.
      if (a.ficha) enviar.push(linhaDe(a.ficha))
      else if (r) enviar.push(linhaExcluida(id, exclusoes[id] ?? new Date(a.quando).toISOString()))
    } else if (r && (!a || r.quando > a.quando)) {
      // A nuvem tem a versão mais nova.
      const temLocal = locais.some((p) => p.id === id)
      if (r.ficha) {
        if (temLocal) trocadas.set(id, r.ficha)
        else vindas.push(r.ficha)
        alteradosAqui.push(id)
      } else if (temLocal) {
        removidas.add(id)
        alteradosAqui.push(id)
      }
    }
  }

  const resultado = locais.filter((p) => !removidas.has(p.id)).map((p) => trocadas.get(p.id) ?? p)
  vindas.sort((x, y) => tempo(y.atualizadoEm) - tempo(x.atualizadoEm))
  return { locais: [...vindas, ...resultado], enviar, alteradosAqui }
}

/** Lê as lápides salvas, ignorando lixo. */
export function lerExclusoes(bruto: string | null): Exclusoes {
  try {
    const x: unknown = bruto ? JSON.parse(bruto) : {}
    if (!x || typeof x !== 'object' || Array.isArray(x)) return {}
    return Object.fromEntries(Object.entries(x).filter(([, v]) => typeof v === 'string')) as Exclusoes
  } catch {
    return {}
  }
}
