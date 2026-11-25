import type { FichaCalculada } from '../../../regras/dnd5e/motor/ficha'
import type { Personagem } from '../../../regras/dnd5e/tipos'

export interface PropsAba {
  p: Personagem
  f: FichaCalculada
  atualizar: (novo: Personagem) => void
}
