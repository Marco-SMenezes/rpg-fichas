import { useEffect, useRef, type ReactNode } from 'react'
import { Icone } from './Icone'

interface Props {
  aberto: boolean
  titulo: string
  aoFechar: () => void
  children: ReactNode
  rodape?: ReactNode
}

/** Diálogo nativo: foco preso, Esc fecha, vira folha inferior no celular. */
export function Dialogo({ aberto, titulo, aoFechar, children, rodape }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (aberto && !d.open) d.showModal()
    if (!aberto && d.open) d.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-label={titulo}
      onClose={aoFechar}
      onClick={(e) => {
        if (e.target === ref.current) aoFechar()
      }}
    >
      {aberto && (
        <>
          <div className="dialogo__cabeca">
            <h2>{titulo}</h2>
            <button type="button" className="botao botao--fantasma botao--icone" onClick={aoFechar} aria-label="Fechar">
              <Icone nome="fechar" />
            </button>
          </div>
          <div className="dialogo__corpo">{children}</div>
          {rodape && <div className="dialogo__rodape">{rodape}</div>}
        </>
      )}
    </dialog>
  )
}
