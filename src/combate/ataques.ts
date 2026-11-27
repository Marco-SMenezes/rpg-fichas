/**
 * Ataque com alvo no combate: de onde vêm os ataques (bloco do monstro ou ficha) e
 * como o resultado é lido contra a CA. Puro, para testar.
 */
import type { Monstro } from '../regras/dnd5e/dados/monstros/tipos'
import { calcularFicha } from '../regras/dnd5e/motor/ficha'
import type { Personagem } from '../regras/dnd5e/tipos'

export interface AtaqueDeCombate {
  nome: string
  bonus: number
  /** Expressão de dano, pronta para rolar (ex.: "2d10+6+1d8"). Vazia: ataque sem dano. */
  dano: string
  tipo: string
}

const ACERTO = /([+-]\d+) para acertar/
const DANO = /\((\d+d\d+)(?: ([+-]) (\d+))?\) de dano (?:de )?([a-zà-ú]+)/gi

/** Os ataques do bloco do monstro: texto "+4 para acertar … Acerto: 5 (1d6 + 2) de dano cortante". */
export function ataquesDoMonstro(m: Monstro): AtaqueDeCombate[] {
  const r: AtaqueDeCombate[] = []
  for (const a of [...m.acoes, ...(m.acoesBonus ?? [])]) {
    const acerto = ACERTO.exec(a.texto)
    if (!acerto) continue
    // Só o dano do acerto, até o fim da frase e antes de uma alternativa ("ou … com duas mãos").
    const depois = a.texto.split(/Acerto:/i)[1] ?? ''
    const frase = depois.split(/\.(?:\s|$)/)[0]!.split(/,? ou /)[0]!
    const dados = [...frase.matchAll(DANO)]
    // Dano fixo, sem dados ("Acerto: 1 de dano perfurante").
    const fixo = !dados.length ? /^\s*(\d+) de dano (?:de )?([a-zà-ú]+)/i.exec(frase) : null
    if (fixo) {
      r.push({ nome: a.nome, bonus: Number(acerto[1]), dano: fixo[1]!, tipo: fixo[2]!.toLowerCase() })
      continue
    }
    r.push({
      nome: a.nome,
      bonus: Number(acerto[1]),
      dano: dados.map((d) => `${d[1]}${d[2] ? `${d[2]}${d[3]}` : ''}`).join('+'),
      tipo: dados.map((d) => d[4]!.toLowerCase()).join(' + '),
    })
  }
  return r
}

/** Os ataques calculados da ficha (armas e ataque desarmado). */
export function ataquesDaFicha(p: Personagem): AtaqueDeCombate[] {
  return calcularFicha(p).ataques.map((a) => ({ nome: a.nome, bonus: a.bonusAtaque, dano: a.dano, tipo: a.tipoDano }))
}

export type Resultado = 'critico' | 'acerto' | 'erro' | 'falha-critica'

/** 20 natural sempre acerta (crítico), 1 natural sempre erra; sem CA conhecida, null (quem decide é o mestre). */
export function resultadoDoAtaque(total: number, d20: number | null, ca: number | null): Resultado | null {
  if (d20 === 20) return 'critico'
  if (d20 === 1) return 'falha-critica'
  if (ca === null) return null
  return total >= ca ? 'acerto' : 'erro'
}
