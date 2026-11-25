import type { Atributo, PericiaId } from '../tipos'

export const ATRIBUTOS: { id: Atributo; nome: string; abrev: string }[] = [
  { id: 'for', nome: 'Força', abrev: 'FOR' },
  { id: 'des', nome: 'Destreza', abrev: 'DES' },
  { id: 'con', nome: 'Constituição', abrev: 'CON' },
  { id: 'int', nome: 'Inteligência', abrev: 'INT' },
  { id: 'sab', nome: 'Sabedoria', abrev: 'SAB' },
  { id: 'car', nome: 'Carisma', abrev: 'CAR' },
]

export const NOME_ATRIBUTO: Record<Atributo, string> = Object.fromEntries(
  ATRIBUTOS.map((a) => [a.id, a.nome]),
) as Record<Atributo, string>

/** Perícias e o atributo de cada uma (LdJ p. 176–180). */
export const PERICIAS: { id: PericiaId; nome: string; atributo: Atributo }[] = [
  { id: 'acrobacia', nome: 'Acrobacia', atributo: 'des' },
  { id: 'adestrarAnimais', nome: 'Adestrar Animais', atributo: 'sab' },
  { id: 'arcanismo', nome: 'Arcanismo', atributo: 'int' },
  { id: 'atletismo', nome: 'Atletismo', atributo: 'for' },
  { id: 'atuacao', nome: 'Atuação', atributo: 'car' },
  { id: 'enganacao', nome: 'Enganação', atributo: 'car' },
  { id: 'furtividade', nome: 'Furtividade', atributo: 'des' },
  { id: 'historia', nome: 'História', atributo: 'int' },
  { id: 'intimidacao', nome: 'Intimidação', atributo: 'car' },
  { id: 'intuicao', nome: 'Intuição', atributo: 'sab' },
  { id: 'investigacao', nome: 'Investigação', atributo: 'int' },
  { id: 'medicina', nome: 'Medicina', atributo: 'sab' },
  { id: 'natureza', nome: 'Natureza', atributo: 'int' },
  { id: 'percepcao', nome: 'Percepção', atributo: 'sab' },
  { id: 'persuasao', nome: 'Persuasão', atributo: 'car' },
  { id: 'prestidigitacao', nome: 'Prestidigitação', atributo: 'des' },
  { id: 'religiao', nome: 'Religião', atributo: 'int' },
  { id: 'sobrevivencia', nome: 'Sobrevivência', atributo: 'sab' },
]

export const NOME_PERICIA: Record<PericiaId, string> = Object.fromEntries(
  PERICIAS.map((p) => [p.id, p.nome]),
) as Record<PericiaId, string>

/** Compra de pontos: custo de cada valor (LdJ p. 13). */
export const CUSTO_COMPRA_PONTOS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}
export const PONTOS_DISPONIVEIS = 27

/** Valores padrão (LdJ p. 13). */
export const VALORES_PADRAO = [15, 14, 13, 12, 10, 8]
