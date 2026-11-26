/** Regras puras das campanhas (Etapa 3): códigos de convite e rolagens compartilhadas. */
import type { Modo, ResultadoDado, Rolagem } from '../rolagem/rolagem'

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Sistema da campanha: decide quais fichas podem entrar. */
export type SistemaDaCampanha = 'dnd5e' | 'personalizada'

export const SISTEMAS: { id: SistemaDaCampanha; nome: string; ajuda: string }[] = [
  { id: 'dnd5e', nome: 'D&D 5e', ajuda: 'Só entram fichas de D&D 5e.' },
  { id: 'personalizada', nome: 'Personalizada', ajuda: 'Só entram fichas personalizadas, feitas no Construtor de fichas.' },
]

export const nomeDoSistema = (s: string | null | undefined) => SISTEMAS.find((x) => x.id === s)?.nome ?? 'D&D 5e'

export const sistemaValido = (s: unknown): SistemaDaCampanha => (s === 'personalizada' ? 'personalizada' : 'dnd5e')

/** A ficha com este id pode entrar numa campanha deste sistema? (o banco confere de novo) */
export function fichaServe(sistema: SistemaDaCampanha, fichaId: string): boolean {
  const personalizada = fichaId.startsWith('livre-')
  if (sistema === 'personalizada') return personalizada
  return !personalizada && !fichaId.startsWith('modelo-')
}

/** Aceita o código como a pessoa digitar: minúsculas, espaços, hífen. */
export function normalizarCodigo(texto: string): string {
  return texto.toUpperCase().replace(/[\s-]/g, '')
}

export function codigoValido(texto: string): boolean {
  const c = normalizarCodigo(texto)
  return c.length === 6 && [...c].every((x) => ALFABETO.includes(x))
}

/** O que vai para a coluna `detalhe` da rolagem compartilhada. */
export interface DetalheRolagem {
  modo: Modo
  critico: boolean
  dados: ResultadoDado[]
  modificador: number
  d20: number | null
}

export interface RolagemDaMesa {
  id: number
  campanha_id: string
  autor: string
  quem: string
  rotulo: string
  expressao: string
  total: number
  detalhe: DetalheRolagem
  criado_em: string
}

export function linhaDeRolagem(campanhaId: string, quem: string, r: Rolagem) {
  const detalhe: DetalheRolagem = {
    modo: r.modo,
    critico: r.critico,
    dados: r.dados.slice(0, 40),
    modificador: r.modificador,
    d20: r.d20,
  }
  return {
    campanha_id: campanhaId,
    quem: quem.slice(0, 80),
    rotulo: r.rotulo.slice(0, 120),
    expressao: r.expressao.slice(0, 60),
    total: r.total,
    detalhe,
  }
}

/** Converte o que veio do banco, tolerando detalhes faltando. */
export function lerRolagemDaMesa(x: unknown): RolagemDaMesa | null {
  if (!x || typeof x !== 'object') return null
  const r = x as Record<string, unknown>
  if (typeof r.id !== 'number' || typeof r.total !== 'number' || typeof r.campanha_id !== 'string') return null
  const d = (r.detalhe && typeof r.detalhe === 'object' ? r.detalhe : {}) as Partial<DetalheRolagem>
  return {
    id: r.id,
    campanha_id: r.campanha_id,
    autor: String(r.autor ?? ''),
    quem: String(r.quem ?? ''),
    rotulo: String(r.rotulo ?? ''),
    expressao: String(r.expressao ?? ''),
    total: r.total,
    criado_em: String(r.criado_em ?? ''),
    detalhe: {
      modo: d.modo === 'vantagem' || d.modo === 'desvantagem' ? d.modo : 'normal',
      critico: d.critico === true,
      dados: Array.isArray(d.dados) ? d.dados : [],
      modificador: typeof d.modificador === 'number' ? d.modificador : 0,
      d20: typeof d.d20 === 'number' ? d.d20 : null,
    },
  }
}

/** Junta rolagens novas às que já estão na tela: sem repetir, mais novas primeiro, no máximo `limite`. */
export function juntarRolagens(atuais: RolagemDaMesa[], novas: RolagemDaMesa[], limite = 50): RolagemDaMesa[] {
  const porId = new Map<number, RolagemDaMesa>()
  for (const r of [...novas, ...atuais]) if (!porId.has(r.id)) porId.set(r.id, r)
  return [...porId.values()].sort((a, b) => b.id - a.id).slice(0, limite)
}
