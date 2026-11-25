import type { Historia, Personalidade } from '../tipos'

/** Tendências (LdJ p. 124). */
export const TENDENCIAS = [
  'Leal e Bom',
  'Neutro e Bom',
  'Caótico e Bom',
  'Leal e Neutro',
  'Neutro',
  'Caótico e Neutro',
  'Leal e Mau',
  'Neutro e Mau',
  'Caótico e Mau',
]

export const HISTORIA_VAZIA: Historia = {
  idade: '',
  genero: '',
  altura: '',
  peso: '',
  olhos: '',
  cabelo: '',
  pele: '',
  aparencia: '',
  tendencia: '',
  objetivo: '',
  passado: '',
}

export const PERSONALIDADE_VAZIA: Personalidade = { tracos: '', ideais: '', vinculos: '', defeitos: '' }
