/** Escolha de magias: o que cada personagem pode pegar e quantas. */
import { MAGIAS, MAGIA_POR_ID } from '../dados/magias'
import type { Magia, Personagem } from '../tipos'
import { calcularFicha, regrasAtivas } from './ficha'

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

/** Magias que o personagem pode adicionar agora (lista da classe + lista expandida do patrono). */
export function magiasDisponiveis(p: Personagem): Magia[] {
  const lista = listaDeMagias(p)
  if (!lista) return []
  const extra = Math.max(0, ...regrasAtivas(p).map((r) => r.magias?.nivelMaximoExtra?.(p.nivel) ?? 0))
  const max = Math.max(nivelMaximoDeMagia(p), extra)
  const expandida = new Set(regrasAtivas(p).flatMap((r) => Object.values(r.listaExpandida ?? {}).flat()))
  return MAGIAS.filter((m) => (m.classes.includes(lista) || expandida.has(m.id)) && m.nivel <= max)
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
  }
}
