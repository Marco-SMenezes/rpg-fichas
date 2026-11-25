import type { Antecedente, Classe, Raca, Subclasse, Subraca } from '../tipos'
import { ANTECEDENTES } from './antecedentes'
import { LADINO } from './ladino'
import { RACAS } from './racas'

export const CLASSES: Classe[] = [LADINO]
export { ANTECEDENTES, RACAS }

function achar<T extends { id: string }>(lista: T[], id: string, tipo: string): T {
  const item = lista.find((x) => x.id === id)
  if (!item) throw new Error(`${tipo} desconhecido: ${id}`)
  return item
}

export const obterRaca = (id: string): Raca => achar(RACAS, id, 'Raça')
export const obterClasse = (id: string): Classe => achar(CLASSES, id, 'Classe')
export const obterAntecedente = (id: string): Antecedente => achar(ANTECEDENTES, id, 'Antecedente')

export function obterSubraca(raca: Raca, id: string | null): Subraca | null {
  return id ? (raca.subracas.find((s) => s.id === id) ?? null) : null
}

export function obterSubclasse(classe: Classe, id: string | null): Subclasse | null {
  return id ? (classe.subclasses.find((s) => s.id === id) ?? null) : null
}
