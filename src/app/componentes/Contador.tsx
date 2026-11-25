interface Props {
  valor: number
  rotulo: string
  min?: number
  max?: number
  aoMudar: (valor: number) => void
}

export function Contador({ valor, rotulo, min = -Infinity, max = Infinity, aoMudar }: Props) {
  return (
    <div className="contador" role="group" aria-label={rotulo}>
      <button type="button" onClick={() => aoMudar(valor - 1)} disabled={valor <= min} aria-label={`Diminuir ${rotulo}`}>
        −
      </button>
      <output className="numeros" aria-live="polite">
        {valor}
      </output>
      <button type="button" onClick={() => aoMudar(valor + 1)} disabled={valor >= max} aria-label={`Aumentar ${rotulo}`}>
        +
      </button>
    </div>
  )
}
