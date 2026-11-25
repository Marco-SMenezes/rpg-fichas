import { useSyncExternalStore } from 'react'
import {
  excluirPersonagem,
  listarPersonagens,
  salvarPersonagem,
  salvarTodos,
} from '../armazenamento/personagens'
import type { Personagem } from '../regras/dnd5e/tipos'

let cache: Personagem[] = listarPersonagens()
const ouvintes = new Set<() => void>()

function avisar() {
  cache = listarPersonagens()
  ouvintes.forEach((o) => o())
}

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
    return salvo
  },
  excluir(id: string) {
    excluirPersonagem(id)
    avisar()
  },
  adicionarVarios(lista: Personagem[]) {
    salvarTodos([...lista, ...listarPersonagens()])
    avisar()
  },
}
