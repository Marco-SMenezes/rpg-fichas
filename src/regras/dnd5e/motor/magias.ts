/** Escolha de magias: o que cada personagem pode pegar e quantas. */
import { MAGIAS, MAGIA_POR_ID } from '../dados/magias'
import type { Atributo, Magia, Personagem } from '../tipos'
import { calcularFicha, regrasAtivas } from './ficha'
import { talentosDe } from './talentos'

/** Lista de magias usada pelo personagem: a da classe ou, para Cavaleiro Arcano e Trapaceiro Arcano, a de mago. */
export function listaDeMagias(p: Personagem): string | null {
  const [classe, subclasse] = regrasAtivas(p)
  if (classe.conjuracao) return classe.id
  if (subclasse && 'conjuracao' in subclasse && subclasse.conjuracao) return 'mago'
  return null
}

/** Maior nível de magia que o personagem já conjura (0 se só truques). */
export function nivelMaximoDeMagia(p: Personagem): number {
  return calcularFicha(p).conjuracao?.espacos.length ?? 0
}

/** Quantas magias de qualquer classe o personagem pode ter (Segredos Mágicos do bardo). */
export function segredosMagicos(p: Personagem): number {
  return regrasAtivas(p).reduce((n, r) => n + (r.segredosMagicos?.(p.nivel).total ?? 0), 0)
}

/** A magia é da lista do personagem (classe ou lista expandida)? Senão, só entra como Segredo Mágico. */
export function daListaDoPersonagem(p: Personagem, m: Magia): boolean {
  const lista = listaDeMagias(p)
  if (!lista) return false
  const expandida = new Set(regrasAtivas(p).flatMap((r) => Object.values(r.listaExpandida ?? {}).flat()))
  return m.classes.includes(lista) || expandida.has(m.id)
}

/**
 * Magias que o personagem pode adicionar agora: lista da classe, lista expandida do patrono
 * e, com Segredos Mágicos, as de qualquer classe (`deOutrasClasses`).
 */
export function magiasDisponiveis(p: Personagem, deOutrasClasses = false): Magia[] {
  if (!listaDeMagias(p)) return []
  const extra = Math.max(0, ...regrasAtivas(p).map((r) => r.magias?.nivelMaximoExtra?.(p.nivel) ?? 0))
  const max = Math.max(nivelMaximoDeMagia(p), extra)
  const outras = deOutrasClasses && segredosMagicos(p) > 0
  return MAGIAS.filter((m) => m.nivel <= max && (outras || daListaDoPersonagem(p, m)))
}

/** Magias sempre preparadas pelo nível atual (domínio, juramento, terreno…). */
export function magiasSempre(p: Personagem): Magia[] {
  const ids = regrasAtivas(p).flatMap((r) => {
    const porNivel = (tabela: Record<number, string[]> | undefined) =>
      Object.entries(tabela ?? {})
        .filter(([n]) => Number(n) <= p.nivel)
        .flatMap(([, x]) => x)
    const porEscolha = r.magiasPorEscolha ? porNivel(r.magiasPorEscolha.porOpcao[p.escolhasDeClasse?.[r.magiasPorEscolha.escolha] ?? '']) : []
    return [...porNivel(r.magiasSempre), ...porEscolha]
  })
  return Array.from(new Set(ids))
    .map((id) => MAGIA_POR_ID[id])
    .filter((m): m is Magia => !!m)
    .sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome))
}

export interface LimitesDeMagia {
  truques: number | null
  /** Magias de 1º nível ou mais que conhece (null = prepara da lista inteira). */
  conhecidas: number | null
  preparadas: number | null
}

export function limitesDeMagia(p: Personagem): LimitesDeMagia {
  const c = calcularFicha(p).conjuracao
  return { truques: c?.truques ?? null, conhecidas: c?.conhecidas ?? null, preparadas: c?.preparadas ?? null }
}

export function magiasDoPersonagem(p: Personagem): (Magia & { preparada: boolean })[] {
  return p.magias
    .map((x) => (MAGIA_POR_ID[x.id] ? { ...MAGIA_POR_ID[x.id]!, preparada: x.preparada } : null))
    .filter((x): x is Magia & { preparada: boolean } => x !== null)
    .sort((a, b) => a.nivel - b.nivel || a.nome.localeCompare(b.nome))
}

export function alternarMagia(p: Personagem, id: string): Personagem {
  const tem = p.magias.some((x) => x.id === id)
  const magias = tem ? p.magias.filter((x) => x.id !== id) : [...p.magias, { id, preparada: true }]
  return { ...p, magias }
}

export function alternarPreparada(p: Personagem, id: string): Personagem {
  return { ...p, magias: p.magias.map((x) => (x.id === id ? { ...x, preparada: !x.preparada } : x)) }
}

/** Contagem atual para comparar com os limites. */
export function contagemDeMagias(p: Personagem) {
  const minhas = magiasDoPersonagem(p)
  return {
    truques: minhas.filter((m) => m.nivel === 0).length,
    conhecidas: minhas.filter((m) => m.nivel > 0).length,
    preparadas: minhas.filter((m) => m.nivel > 0 && m.preparada).length,
    segredos: minhas.filter((m) => !daListaDoPersonagem(p, m)).length,
  }
}

export interface MagiaDeTalento {
  magia: Magia
  talento: string
  uso: 'truque' | 'diaria' | 'ritual'
  atributo: Atributo | null
  recursoId?: string
}

/** Magias que vêm de talentos (Iniciado em Magia, Atirador de Magia, Conjurador de Ritual). */
export function magiasDeTalentos(p: Personagem): MagiaDeTalento[] {
  return talentosDe(p).flatMap(({ talento, escolhas }) =>
    (talento.magias?.(escolhas) ?? [])
      .flatMap((x): MagiaDeTalento[] => {
        const magia = MAGIA_POR_ID[x.id]
        if (!magia) return []
        return [{ magia, talento: talento.nome, uso: x.uso, atributo: x.atributo, ...(x.recursoId ? { recursoId: x.recursoId } : {}) }]
      }),
  )
}
