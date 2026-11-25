/**
 * Persistência local (Etapa 1). Guarda os personagens no localStorage do navegador.
 * A interface depende só destas funções, para trocar por Supabase na Etapa 2.
 */
import { normalizarPersonagem, novoId } from '../regras/dnd5e/motor/criacao'
import type { Personagem } from '../regras/dnd5e/tipos'

const CHAVE = 'tomo:personagens:v1'

export interface Armazem {
  getItem(chave: string): string | null
  setItem(chave: string, valor: string): void
}

function armazemPadrao(): Armazem | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function listarPersonagens(armazem = armazemPadrao()): Personagem[] {
  if (!armazem) return []
  try {
    const bruto = armazem.getItem(CHAVE)
    const lista: unknown = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista.filter(pareceComPersonagem).map(normalizarPersonagem) : []
  } catch {
    return []
  }
}

export function salvarTodos(lista: Personagem[], armazem = armazemPadrao()): void {
  armazem?.setItem(CHAVE, JSON.stringify(lista))
}

export function salvarPersonagem(p: Personagem, armazem = armazemPadrao()): Personagem {
  const atualizado = { ...p, atualizadoEm: new Date().toISOString() }
  const lista = listarPersonagens(armazem)
  const indice = lista.findIndex((x) => x.id === p.id)
  if (indice >= 0) lista[indice] = atualizado
  else lista.unshift(atualizado)
  salvarTodos(lista, armazem)
  return atualizado
}

export function excluirPersonagem(id: string, armazem = armazemPadrao()): void {
  salvarTodos(
    listarPersonagens(armazem).filter((p) => p.id !== id),
    armazem,
  )
}

export function duplicarPersonagem(p: Personagem): Personagem {
  const agora = new Date().toISOString()
  return { ...structuredClone(p), id: novoId('pj'), nome: `${p.nome} (cópia)`, criadoEm: agora, atualizadoEm: agora }
}

/* ---------- Exportar e importar ---------- */

export interface ArquivoTomo {
  formato: 'tomo'
  versao: 1
  exportadoEm: string
  personagens: Personagem[]
}

export function exportar(personagens: Personagem[]): string {
  const arquivo: ArquivoTomo = {
    formato: 'tomo',
    versao: 1,
    exportadoEm: new Date().toISOString(),
    personagens,
  }
  return JSON.stringify(arquivo, null, 2)
}

function pareceComPersonagem(x: unknown): x is Personagem {
  if (!x || typeof x !== 'object') return false
  const p = x as Record<string, unknown>
  return (
    p.versao === 1 &&
    p.sistema === 'dnd5e' &&
    typeof p.id === 'string' &&
    typeof p.nome === 'string' &&
    typeof p.nivel === 'number' &&
    typeof p.racaId === 'string' &&
    typeof p.classeId === 'string' &&
    typeof p.atributosBase === 'object' &&
    Array.isArray(p.inventario) &&
    typeof p.estado === 'object'
  )
}

export type ResultadoImportacao = { ok: true; personagens: Personagem[] } | { ok: false; erro: string }

/** Lê um arquivo exportado. Ids repetidos ganham um id novo para não sobrescrever nada. */
export function importar(texto: string, existentes: Personagem[]): ResultadoImportacao {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    return { ok: false, erro: 'O arquivo não é um JSON válido.' }
  }
  const lista = (dados as ArquivoTomo | null)?.formato === 'tomo' ? (dados as ArquivoTomo).personagens : [dados]
  if (!Array.isArray(lista) || lista.length === 0) return { ok: false, erro: 'Nenhum personagem no arquivo.' }
  const validos = lista.filter(pareceComPersonagem).map(normalizarPersonagem)
  if (validos.length === 0) return { ok: false, erro: 'O arquivo não tem fichas do Tomo.' }
  const ids = new Set(existentes.map((p) => p.id))
  return {
    ok: true,
    personagens: validos.map((p) => (ids.has(p.id) ? { ...p, id: novoId('pj') } : p)),
  }
}
