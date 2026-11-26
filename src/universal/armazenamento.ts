/** Modelos e fichas livres no aparelho (localStorage), com aviso para a interface. */
import { useSyncExternalStore } from 'react'
import { aoSalvarFichaLivre } from '../combate/ponte'
import { agendarSincronizacao, registrarColecao, registrarExclusao } from '../nuvem/nuvem'
import { modeloDeExemplo, normalizarFichaLivre, normalizarModelo, novoId, valoresIniciais, type FichaLivre, type Modelo } from './modelo'

const CHAVE_MODELOS = 'tomo:modelos:v1'
const CHAVE_FICHAS = 'tomo:fichaslivres:v1'

function ler<T>(chave: string, normalizar: (x: unknown) => T | null): T[] {
  try {
    const bruto = localStorage.getItem(chave)
    const lista: unknown = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista.map(normalizar).filter((x): x is T => x !== null) : []
  } catch {
    return []
  }
}

function gravar(chave: string, lista: unknown[]) {
  try {
    localStorage.setItem(chave, JSON.stringify(lista))
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
}

let modelos: Modelo[] = ler(CHAVE_MODELOS, normalizarModelo)
let fichas: FichaLivre[] = ler(CHAVE_FICHAS, normalizarFichaLivre)
const ouvintes = new Set<() => void>()

function avisar() {
  ouvintes.forEach((o) => o())
}

function assinar(o: () => void) {
  ouvintes.add(o)
  const aoMudar = (e: StorageEvent) => {
    if (e.key === CHAVE_MODELOS) modelos = ler(CHAVE_MODELOS, normalizarModelo)
    if (e.key === CHAVE_FICHAS) fichas = ler(CHAVE_FICHAS, normalizarFichaLivre)
    if (e.key === CHAVE_MODELOS || e.key === CHAVE_FICHAS) avisar()
  }
  window.addEventListener('storage', aoMudar)
  return () => {
    ouvintes.delete(o)
    window.removeEventListener('storage', aoMudar)
  }
}

export const useModelos = () => useSyncExternalStore(assinar, () => modelos)
export const useFichasLivres = () => useSyncExternalStore(assinar, () => fichas)

export const listarFichasLivres = () => fichas
export const listarModelos = () => modelos

const agora = () => new Date().toISOString()

export const livres = {
  salvarModelo(m: Modelo): Modelo {
    const quando = agora()
    const salvo = { ...m, atualizadoEm: quando }
    modelos = modelos.some((x) => x.id === m.id) ? modelos.map((x) => (x.id === m.id ? salvo : x)) : [salvo, ...modelos]
    gravar(CHAVE_MODELOS, modelos)
    // As fichas levam uma cópia do modelo para a nuvem (o mestre lê por ela): marcam mudança também.
    if (fichas.some((f) => f.modeloId === m.id)) {
      fichas = fichas.map((f) => (f.modeloId === m.id ? { ...f, atualizadoEm: quando } : f))
      gravar(CHAVE_FICHAS, fichas)
    }
    avisar()
    agendarSincronizacao()
    return salvo
  },
  /** Cria um modelo novo: em branco ou a partir do exemplo. */
  novoModelo(exemplo: boolean): Modelo {
    const base = exemplo
      ? modeloDeExemplo()
      : { id: novoId('modelo'), nome: 'Novo modelo', descricao: '', secoes: ['Principal'], campos: [], criadoEm: agora(), atualizadoEm: agora() }
    return this.salvarModelo(base)
  },
  duplicarModelo(m: Modelo): Modelo {
    return this.salvarModelo({ ...structuredClone(m), id: novoId('modelo'), nome: `${m.nome} (cópia)`, criadoEm: agora() })
  },
  /** Apaga o modelo e as fichas feitas com ele. */
  excluirModelo(id: string) {
    for (const f of fichas.filter((x) => x.modeloId === id)) registrarExclusao(f.id)
    registrarExclusao(id)
    modelos = modelos.filter((x) => x.id !== id)
    fichas = fichas.filter((f) => f.modeloId !== id)
    gravar(CHAVE_MODELOS, modelos)
    gravar(CHAVE_FICHAS, fichas)
    avisar()
  },
  criarFicha(modelo: Modelo, nome: string): FichaLivre {
    const f: FichaLivre = { id: novoId('livre'), modeloId: modelo.id, nome: nome.trim() || 'Sem nome', valores: valoresIniciais(modelo), criadoEm: agora(), atualizadoEm: agora() }
    return this.salvarFicha(f)
  },
  salvarFicha(f: FichaLivre): FichaLivre {
    const salva = { ...f, atualizadoEm: agora() }
    fichas = fichas.some((x) => x.id === f.id) ? fichas.map((x) => (x.id === f.id ? salva : x)) : [salva, ...fichas]
    gravar(CHAVE_FICHAS, fichas)
    avisar()
    agendarSincronizacao()
    aoSalvarFichaLivre(salva)
    return salva
  },
  excluirFicha(id: string) {
    registrarExclusao(id)
    fichas = fichas.filter((x) => x.id !== id)
    gravar(CHAVE_FICHAS, fichas)
    avisar()
  },
}

/* ---------- Exportar e importar ---------- */

export interface ArquivoModelo {
  formato: 'tomo-modelo'
  versao: 1
  modelo: Modelo
  fichas: FichaLivre[]
}

export function exportarModelo(m: Modelo, comFichas: FichaLivre[] = []): string {
  const arquivo: ArquivoModelo = { formato: 'tomo-modelo', versao: 1, modelo: m, fichas: comFichas }
  return JSON.stringify(arquivo, null, 2)
}

/** Importa um modelo (e as fichas dele) com ids novos, para nunca sobrescrever nada. */
export function importarModelo(texto: string): { ok: true; modelo: Modelo; fichas: number } | { ok: false; erro: string } {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    return { ok: false, erro: 'O arquivo não é um JSON válido.' }
  }
  const arq = dados as Partial<ArquivoModelo>
  if (arq?.formato !== 'tomo-modelo') return { ok: false, erro: 'Não é um modelo de ficha do Tomo.' }
  const modelo = normalizarModelo(arq.modelo)
  if (!modelo) return { ok: false, erro: 'O modelo do arquivo está incompleto.' }
  const novo = livres.salvarModelo({ ...modelo, id: novoId('modelo') })
  const doArquivo = (Array.isArray(arq.fichas) ? arq.fichas : []).map(normalizarFichaLivre).filter((f): f is FichaLivre => !!f)
  for (const f of doArquivo) livres.salvarFicha({ ...f, id: novoId('livre'), modeloId: novo.id })
  return { ok: true, modelo: novo, fichas: doArquivo.length }
}

/* ---------- Nuvem: modelos e fichas livres vão na mesma tabela das fichas de D&D ---------- */

/** Modelos que chegaram dentro de fichas (de outro aparelho) e ainda não existem aqui. */
const modelosVindos = new Map<string, Modelo>()

registrarColecao<Modelo>({
  nome: 'modelos',
  pertence: (id) => id.startsWith('modelo-'),
  listar: () => modelos,
  gravar: (lista) => {
    modelos = lista
    gravar(CHAVE_MODELOS, modelos)
    avisar()
  },
  paraDados: (m) => ({ sistema: 'modelo', nome: m.nome, modelo: m }),
  deDados: (d) => ((d as { sistema?: string })?.sistema === 'modelo' ? normalizarModelo((d as { modelo?: unknown }).modelo) : null),
})

registrarColecao<FichaLivre>({
  nome: 'fichas livres',
  pertence: (id) => id.startsWith('livre-'),
  listar: () => fichas,
  gravar: (lista) => {
    // Ficha cujo modelo não está aqui: usa a cópia que veio junto.
    const faltando = [...new Set(lista.map((f) => f.modeloId))].filter((id) => !modelos.some((m) => m.id === id))
    for (const id of faltando) {
      const m = modelosVindos.get(id)
      if (m) modelos = [m, ...modelos]
    }
    if (faltando.length) gravar(CHAVE_MODELOS, modelos)
    fichas = lista
    gravar(CHAVE_FICHAS, fichas)
    avisar()
  },
  // Vai com o nome solto (para a lista da mesa) e uma cópia do modelo (para o mestre abrir).
  paraDados: (f) => ({ sistema: 'livre', nome: f.nome, ficha: f, modelo: modelos.find((m) => m.id === f.modeloId) ?? null }),
  deDados: (d) => {
    const dados = d as { sistema?: string; ficha?: unknown; modelo?: unknown }
    if (dados?.sistema !== 'livre') return null
    const ficha = normalizarFichaLivre(dados.ficha)
    const modelo = normalizarModelo(dados.modelo)
    if (ficha && modelo && modelo.id === ficha.modeloId) modelosVindos.set(modelo.id, modelo)
    return ficha
  },
})
