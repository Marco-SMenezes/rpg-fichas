import { ATRIBUTOS } from '../../regras/dnd5e/dados/atributos'
import { incrementoValido } from '../../regras/dnd5e/motor/progressao'
import type { Atributo, ValoresAtributos } from '../../regras/dnd5e/tipos'
import { Contador } from './Contador'

interface Props {
  titulo: string
  /** Valores dos atributos antes deste incremento. */
  atuais: Record<Atributo, number>
  incremento: Partial<ValoresAtributos>
  aoMudar: (novo: Partial<ValoresAtributos>) => void
}

/** +2 em um atributo ou +1 em dois, sem passar de 20 (LdJ p. 91). */
export function EditorIncremento({ titulo, atuais, incremento, aoMudar }: Props) {
  const soma = Object.values(incremento).reduce((a, b) => a + (b ?? 0), 0)
  return (
    <fieldset className="grupo">
      <legend className="rotulo numeros">
        {titulo} ({soma}/2)
      </legend>
      <p className="campo__ajuda">+2 em um atributo ou +1 em dois, até o máximo de 20 (LdJ p. 91).</p>
      <div className="incrementos">
        {ATRIBUTOS.map(({ id, nome }) => {
          const atual = atuais[id]
          const v = incremento[id] ?? 0
          return (
            <div key={id} className="incremento">
              <span>
                {nome} <span className="suave numeros">{atual + v}</span>
              </span>
              <Contador
                rotulo={`${titulo}: ${nome}`}
                valor={v}
                min={0}
                max={Math.max(v, Math.min(2, 20 - atual, v + 2 - soma))}
                aoMudar={(n) => aoMudar({ ...incremento, [id]: n })}
              />
            </div>
          )
        })}
      </div>
      {soma === 2 && !incrementoValido(incremento) && <p className="aviso">Combinação inválida.</p>}
    </fieldset>
  )
}
