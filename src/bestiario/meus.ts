/**
 * Meus monstros: os que o mestre cria, copia do SRD ou importa (por exemplo, do Livro dos
 * Monstros). Ficam no aparelho e na conta, na mesma tabela das fichas, só para o dono.
 */
import { useSyncExternalStore } from 'react'
import { agendarSincronizacao, registrarColecao, registrarExclusao } from '../nuvem/nuvem'
import { normalizarMonstro } from '../regras/dnd5e/dados/monstros/busca'
import type { Monstro } from '../regras/dnd5e/dados/monstros/tipos'
import { novoId } from '../universal/modelo'

const CHAVE = 'tomo:monstros:v1'

function ler(): Monstro[] {
  try {
    const bruto = localStorage.getItem(CHAVE)
    const lista: unknown = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista.map((x) => normalizarMonstro(x, 'meu')).filter((m): m is Monstro => m !== null) : []
  } catch {
    return []
  }
}

function gravar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(monstros))
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
}

let monstros: Monstro[] = ler()
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((o) => o())

function assinar(o: () => void) {
  ouvintes.add(o)
  const aoMudar = (e: StorageEvent) => {
    if (e.key !== CHAVE) return
    monstros = ler()
    avisar()
  }
  window.addEventListener('storage', aoMudar)
  return () => {
    ouvintes.delete(o)
    window.removeEventListener('storage', aoMudar)
  }
}

export const useMeusMonstros = () => useSyncExternalStore(assinar, () => monstros)
export const listarMeusMonstros = () => monstros

const agora = () => new Date().toISOString()

function guardar(lista: Monstro[]) {
  monstros = lista
  gravar()
  avisar()
}

export const meusMonstros = {
  salvar(m: Monstro): Monstro {
    const salvo: Monstro = { ...m, origem: 'meu', atualizadoEm: agora() }
    guardar(monstros.some((x) => x.id === m.id) ? monstros.map((x) => (x.id === m.id ? salvo : x)) : [salvo, ...monstros])
    agendarSincronizacao()
    return salvo
  },
  novo(): Monstro {
    return this.salvar(normalizarMonstro({ nome: 'Novo monstro', tipo: 'Humanoide', criadoEm: agora() }, 'meu')!)
  },
  copiar(m: Monstro): Monstro {
    return this.salvar({
      ...structuredClone(m),
      id: novoId('monstro'),
      nome: `${m.nome} (cópia)`,
      origem: 'meu',
      criadoEm: agora(),
    })
  },
  excluir(id: string) {
    registrarExclusao(id)
    guardar(monstros.filter((m) => m.id !== id))
  },
}

const FORMATO = 'tomo-monstros'

export function exportarMonstros(lista: Monstro[]): string {
  return JSON.stringify({ formato: FORMATO, versao: 1, monstros: lista }, null, 2)
}

export function importarMonstros(texto: string): { ok: true; quantos: number } | { ok: false; erro: string } {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    return { ok: false, erro: 'O arquivo não é um JSON válido.' }
  }
  const d = dados as { formato?: unknown; monstros?: unknown }
  if (d?.formato !== FORMATO || !Array.isArray(d.monstros))
    return {
      ok: false,
      erro: 'Este arquivo não é uma lista de monstros do Tomo.',
    }
  const quando = agora()
  const novos = d.monstros
    .map((x) => normalizarMonstro(x, 'meu'))
    .filter((m): m is Monstro => m !== null)
    .map((m) => ({
      ...m,
      id: novoId('monstro'),
      origem: 'meu' as const,
      criadoEm: quando,
      atualizadoEm: quando,
    }))
  if (!novos.length) return { ok: false, erro: 'Nenhum monstro encontrado no arquivo.' }
  guardar([...novos, ...monstros])
  agendarSincronizacao()
  return { ok: true, quantos: novos.length }
}

// Na nuvem: mesma tabela das fichas, com dados.sistema = 'monstro'.
registrarColecao<Monstro>({
  nome: 'monstros',
  pertence: (id) => id.startsWith('monstro-'),
  listar: () => monstros,
  gravar: guardar,
  paraDados: (m) => ({ sistema: 'monstro', nome: m.nome, monstro: m }),
  deDados: (d) => ((d as { sistema?: string })?.sistema === 'monstro' ? normalizarMonstro((d as { monstro?: unknown }).monstro, 'meu') : null),
})
