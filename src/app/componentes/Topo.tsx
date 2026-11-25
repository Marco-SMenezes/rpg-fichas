import type { ReactNode } from 'react'
import { caminho } from '../rotas'
import { Icone } from './Icone'

interface Props {
  titulo?: string
  voltarPara?: string
  acoes?: ReactNode
}

export function Topo({ titulo, voltarPara, acoes }: Props) {
  return (
    <header className="topo">
      <div className="topo__dentro">
        {voltarPara ? (
          <a className="botao botao--fantasma botao--icone" href={voltarPara} aria-label="Voltar">
            <Icone nome="voltar" />
          </a>
        ) : (
          <a className="topo__marca" href={caminho.lista()} translate="no">
            <Icone nome="d20" tamanho={24} />
            Tomo
          </a>
        )}
        <span className="topo__titulo">{titulo}</span>
        {acoes}
      </div>
    </header>
  )
}
