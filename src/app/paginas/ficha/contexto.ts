import type { FichaCalculada } from '../../../regras/dnd5e/motor/ficha'
import type { Personagem } from '../../../regras/dnd5e/tipos'

export type DialogoFicha = 'vida' | 'descanso' | 'nivel'

export interface PropsBloco {
  p: Personagem
  f: FichaCalculada
  atualizar: (novo: Personagem) => void
  abrir: (dialogo: DialogoFicha) => void
}
