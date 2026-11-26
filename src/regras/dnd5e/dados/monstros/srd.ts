/**
 * Monstros do SRD 5.1 (Wizards of the Coast), licença CC BY 4.0, traduzidos pelo Tomo.
 * Cada lote é um pedaço separado do pacote: só baixa quando alguém abre o bestiário.
 */
import { normalizarMonstro } from './busca'
import type { Monstro } from './tipos'

const LOTES = import.meta.glob<unknown[]>('./srd/lote-*.json', { import: 'default' })

let cache: Promise<Monstro[]> | null = null

export function carregarSRD(): Promise<Monstro[]> {
  cache ??= Promise.all(Object.keys(LOTES).sort().map((k) => LOTES[k]!())).then((lotes) =>
    lotes.flat().map((x) => normalizarMonstro(x, 'srd')).filter((m): m is Monstro => m !== null),
  )
  return cache
}
