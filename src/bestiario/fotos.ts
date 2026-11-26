/**
 * Fotos que o mestre põe nos monstros do SRD (sem copiar o monstro). Ficam no aparelho e na
 * conta (tabela personagens, dados.sistema = 'fotomonstro'), só para o dono.
 */
import { useSyncExternalStore } from 'react'
import { retratoValido } from '../imagem/retrato'
import { agendarSincronizacao, registrarColecao, registrarExclusao } from '../nuvem/nuvem'
import type { Monstro } from '../regras/dnd5e/dados/monstros/tipos'

export interface FotoDeMonstro {
  id: string
  monstroId: string
  foto: string
  atualizadoEm: string
}

const CHAVE = 'tomo:fotosmonstros:v1'
const PREFIXO = 'fotomonstro-'

export function normalizarFotoDeMonstro(x: unknown): FotoDeMonstro | null {
  const d = x as Partial<FotoDeMonstro> | null
  if (!d || typeof d.monstroId !== 'string' || !d.monstroId || !retratoValido(d.foto)) return null
  return {
    id: `${PREFIXO}${d.monstroId}`,
    monstroId: d.monstroId,
    foto: d.foto,
    atualizadoEm: typeof d.atualizadoEm === 'string' ? d.atualizadoEm : new Date().toISOString(),
  }
}

function ler(): FotoDeMonstro[] {
  try {
    const lista: unknown = JSON.parse(localStorage.getItem(CHAVE) ?? '[]')
    return Array.isArray(lista) ? lista.map(normalizarFotoDeMonstro).filter((f): f is FotoDeMonstro => f !== null) : []
  } catch {
    return []
  }
}

let fotos: FotoDeMonstro[] = ler()
let porMonstro: Record<string, string> = indice(fotos)
const ouvintes = new Set<() => void>()

function indice(l: FotoDeMonstro[]) {
  return Object.fromEntries(l.map((f) => [f.monstroId, f.foto]))
}

function guardar(l: FotoDeMonstro[]) {
  fotos = l
  porMonstro = indice(l)
  try {
    localStorage.setItem(CHAVE, JSON.stringify(l))
  } catch {
    /* sem armazenamento: vale nesta visita e vai para a nuvem */
  }
  ouvintes.forEach((o) => o())
}

function assinar(o: () => void) {
  ouvintes.add(o)
  return () => ouvintes.delete(o)
}

/** monstroId → foto (data URL). */
export const useFotosDeMonstros = () => useSyncExternalStore(assinar, () => porMonstro)
export const listarFotosDeMonstros = () => porMonstro

export const fotosDeMonstros = {
  definir(monstroId: string, foto: string) {
    const nova = normalizarFotoDeMonstro({ monstroId, foto, atualizadoEm: new Date().toISOString() })
    if (!nova) return
    guardar([nova, ...fotos.filter((f) => f.monstroId !== monstroId)])
    agendarSincronizacao()
  },
  remover(monstroId: string) {
    registrarExclusao(`${PREFIXO}${monstroId}`)
    guardar(fotos.filter((f) => f.monstroId !== monstroId))
  },
}

/** O monstro com a foto que o mestre pôs (a foto do próprio monstro, se houver, vale mais). */
export function comFoto(m: Monstro, fotosPorMonstro: Record<string, string>): Monstro {
  if (m.foto || !fotosPorMonstro[m.id]) return m
  return { ...m, foto: fotosPorMonstro[m.id]! }
}

registrarColecao<FotoDeMonstro>({
  nome: 'fotos de monstros',
  pertence: (id) => id.startsWith(PREFIXO),
  listar: () => fotos,
  gravar: guardar,
  paraDados: (f) => ({ sistema: 'fotomonstro', nome: f.monstroId, foto: f }),
  deDados: (d) => ((d as { sistema?: string })?.sistema === 'fotomonstro' ? normalizarFotoDeMonstro((d as { foto?: unknown }).foto) : null),
})
