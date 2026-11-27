/** Regras puras do combate: ordem de iniciativa, turno, nomes dos monstros e vida. */
import { resumoPersonagem } from '../app/util'
import { CONDICAO_POR_ID, CONDICOES } from '../regras/dnd5e/dados/condicoes'
import { ajustarPV, alternarCondicao } from '../regras/dnd5e/motor/progressao'
import type { Personagem } from '../regras/dnd5e/tipos'
import { rolar } from '../rolagem/rolagem'
import { atualDoRecurso, calcularFichaLivre, type FichaLivre, type Modelo } from '../universal/modelo'

export interface ParticipanteBase {
  id: string
  nome: string
  iniciativa: number | null
  desempate: number
}

/** Maior iniciativa primeiro; empate pela Destreza; depois pelo nome ("Goblin 2" antes de "Goblin 10"). Sem iniciativa vai para o fim. */
export function ordenarParticipantes<T extends ParticipanteBase>(l: T[]): T[] {
  return [...l].sort((a, b) => {
    if (a.iniciativa === null && b.iniciativa !== null) return 1
    if (b.iniciativa === null && a.iniciativa !== null) return -1
    return (b.iniciativa ?? 0) - (a.iniciativa ?? 0) || b.desempate - a.desempate || a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true })
  })
}

/** Próximo na ordem; do último volta ao primeiro e a rodada aumenta. */
export function proximoTurno(ordem: ParticipanteBase[], vez: string | null, rodada: number): { vez: string | null; rodada: number } {
  if (!ordem.length) return { vez: null, rodada }
  const i = ordem.findIndex((p) => p.id === vez)
  if (i < 0) return { vez: ordem[0]!.id, rodada }
  if (i === ordem.length - 1) return { vez: ordem[0]!.id, rodada: rodada + 1 }
  return { vez: ordem[i + 1]!.id, rodada }
}

/** Quem fica com a vez se `removido` sair do combate. */
export function vezDepoisDeRemover(ordem: ParticipanteBase[], vez: string | null, removido: string): string | null {
  if (vez !== removido) return vez
  const resto = ordem.filter((p) => p.id !== removido)
  if (!resto.length) return null
  const i = ordem.findIndex((p) => p.id === removido)
  return (ordem.slice(i + 1).find((p) => p.id !== removido) ?? resto[0]!).id
}

/** Vez e rodada depois de tirar alguém: se era o último da ordem na vez dele, volta ao topo com rodada nova. */
export function turnoDepoisDeRemover(
  ordem: ParticipanteBase[],
  vez: string | null,
  rodada: number,
  removido: string,
): { vez: string | null; rodada: number } {
  const nova = vezDepoisDeRemover(ordem, vez, removido)
  const eraOUltimo = vez === removido && ordem.length > 1 && ordem[ordem.length - 1]!.id === removido
  return { vez: nova, rodada: eraOUltimo ? rodada + 1 : rodada }
}

/** "Goblin" ×3 → Goblin 1, 2, 3 (continuando a numeração que já está na mesa). */
export function nomesNumerados(nome: string, quantidade: number, existentes: string[]): string[] {
  const n = Math.max(1, Math.trunc(quantidade))
  const usados = existentes
    .map((e) => (e === nome ? 1 : e.startsWith(`${nome} `) ? Number(e.slice(nome.length + 1)) : NaN))
    .filter((x) => Number.isInteger(x) && x > 0)
  if (n === 1 && !usados.length) return [nome]
  const inicio = usados.length ? Math.max(...usados) + 1 : 1
  return Array.from({ length: n }, (_, i) => `${nome} ${inicio + i}`)
}

/** Rola os dados de vida (ex.: "2d6+2"); sem dados legíveis, fica a média. */
export function rolarPV(dadosDeVida: string, media: number, rng: () => number = Math.random): number {
  const r = dadosDeVida.trim() ? rolar(dadosDeVida.replace(/\s+/g, ''), { aleatorio: rng }) : null
  return r ? Math.max(1, r.total) : media
}

/** Condições ativas da ficha, pelo nome (é como o combate guarda). */
export function condicoesDaFicha(p: Personagem): string[] {
  return (p.estado.condicoes ?? []).map((id) => CONDICAO_POR_ID[id]?.nome).filter((x): x is string => !!x)
}

/** Liga ou desliga uma condição (pelo nome) na ficha. Nome desconhecido não muda nada. */
export function comCondicao(p: Personagem, nome: string, ligar: boolean): Personagem {
  const id = CONDICOES.find((c) => c.nome === nome)?.id
  if (!id) return p
  const tem = (p.estado.condicoes ?? []).includes(id)
  return tem === ligar ? p : alternarCondicao(p, id)
}

export const resumoDoPersonagem = (p: Personagem) => resumoPersonagem(p)

/** Ajustes do mestre, em ordem, com as regras de vida da ficha. */
export function aplicarDeltas(p: Personagem, deltas: number[]): Personagem {
  return deltas.reduce((acc, d) => ajustarPV(acc, d), p)
}

function campoDeVida(modelo: Modelo) {
  return modelo.campos.find((c) => c.tipo === 'recurso') ?? null
}

/** Vida da ficha personalizada: o primeiro campo do tipo recurso. */
export function vidaDaFichaLivre(modelo: Modelo, ficha: FichaLivre): { pv: number; max: number } | null {
  const c = campoDeVida(modelo)
  if (!c) return null
  const max = Math.max(0, Math.trunc(calcularFichaLivre(modelo, ficha.valores).expressoes[c.id] ?? 0))
  return { pv: atualDoRecurso(c, ficha.valores), max }
}

export function ajustarVidaLivre(modelo: Modelo, ficha: FichaLivre, delta: number): FichaLivre {
  const c = campoDeVida(modelo)
  const v = vidaDaFichaLivre(modelo, ficha)
  if (!c || !v) return ficha
  const novo = Math.max(0, Math.min(v.max, v.pv + Math.trunc(delta)))
  return { ...ficha, valores: { ...ficha.valores, [c.id]: novo } }
}

export interface Vida {
  pv: number
  pv_max: number
  pv_temp: number
}

/** Mesma regra da ficha: dano tira primeiro do temporário; cura até o máximo; o que passa vira temporário. */
export function ajustarVidaSimples(v: Vida, delta: number): Vida {
  const d = Math.trunc(delta)
  if (d < 0) {
    const doTemp = Math.min(v.pv_temp, -d)
    return { ...v, pv_temp: v.pv_temp - doTemp, pv: Math.max(0, v.pv - (-d - doTemp)) }
  }
  const cura = Math.min(d, Math.max(0, v.pv_max - v.pv))
  return { ...v, pv: v.pv + cura, pv_temp: v.pv_temp + (d - cura) }
}
