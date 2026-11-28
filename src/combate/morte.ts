/**
 * Morte no combate: com três falhas nos testes contra a morte a pessoa está morta neste combate. A linha dela
 * e a ficha ficam travadas (só o mestre traz de volta, com 1 PV) até o combate acabar ou o mestre tirá-la dele.
 * A trava vale só enquanto existe uma linha de jogador da ficha num combate: sem combate, a ficha destrava.
 */
import { situacaoDaMorte } from '../regras/dnd5e/motor/progressao'
import type { Personagem } from '../regras/dnd5e/tipos'

export const AVISO_DE_MORTE = 'Morto neste combate: só o mestre pode trazer de volta.'

interface LinhaDoCombate {
  tipo: 'jogador' | 'monstro'
  personagem_id?: string | null
  pv?: number | null
  morte_falhas?: number | null
}

/** Linha de jogador com três falhas e 0 PV. Com PV de volta (o mestre trouxe) já não conta, mesmo que as falhas ainda não tenham zerado. */
export function mortoNaLinha(l: LinhaDoCombate): boolean {
  return l.tipo === 'jogador' && (l.morte_falhas ?? 0) >= 3 && (l.pv ?? 0) === 0
}

/** A ficha trava se está morta e há uma linha de jogador dela num combate (as linhas de monstro são fichas escondidas do mestre). */
export function fichaTravadaPeloCombate(p: Personagem, minhasLinhas: readonly LinhaDoCombate[]): boolean {
  return situacaoDaMorte(p) === 'morto' && minhasLinhas.some((l) => l.tipo === 'jogador' && l.personagem_id === p.id)
}
