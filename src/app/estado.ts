import { useSyncExternalStore } from 'react'
import {
  excluirPersonagem,
  listarPersonagens,
  salvarPersonagem,
  salvarTodos,
} from '../armazenamento/personagens'
import { aoSalvarFicha } from '../combate/ponte'
import { agendarSincronizacao, nuvem, registrarExclusao } from '../nuvem/nuvem'
import type { Personagem } from '../regras/dnd5e/tipos'

let cache: Personagem[] = listarPersonagens()
const ouvintes = new Set<() => void>()

function avisar() {
  cache = listarPersonagens()
  ouvintes.forEach((o) => o())
}

nuvem.aoMudarLocal(avisar)

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  const aoMudarEmOutraAba = (e: StorageEvent) => {
    if (e.key?.startsWith('tomo:personagens')) avisar()
  }
  window.addEventListener('storage', aoMudarEmOutraAba)
  return () => {
    ouvintes.delete(ouvinte)
    window.removeEventListener('storage', aoMudarEmOutraAba)
  }
}

export function usePersonagens(): Personagem[] {
  return useSyncExternalStore(assinar, () => cache)
}

export const personagens = {
  salvar(p: Personagem): Personagem {
    const salvo = salvarPersonagem(p)
    avisar()
    agendarSincronizacao()
    aoSalvarFicha(salvo)
    return salvo
  },
  excluir(id: string) {
    excluirPersonagem(id)
    registrarExclusao(id)
    avisar()
  },
  adicionarVarios(lista: Personagem[]) {
    salvarTodos([...lista, ...listarPersonagens()])
    avisar()
    agendarSincronizacao()
  },
}

export function useNuvem() {
  return useSyncExternalStore(nuvem.assinar, nuvem.ler)
}
