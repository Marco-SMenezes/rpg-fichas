import type { ReactNode } from 'react'
import { caminho, useRota, type Rota } from '../rotas'
import { Icone } from './Icone'
import { BotaoConta } from './Conta'
import { SeletorTema } from './Tema'

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
        {voltarPara ? <span className="topo__titulo">{titulo}</span> : <Abas />}
        {acoes}
        <BotaoConta />
        <SeletorTema />
      </div>
    </header>
  )
}

const ABAS: { nome: string; href: string; ativa: (r: Rota) => boolean }[] = [
  { nome: 'Personagens', href: caminho.lista(), ativa: (r) => r.nome === 'lista' },
  { nome: 'Campanhas', href: caminho.campanhas(), ativa: (r) => r.nome === 'campanhas' || r.nome === 'campanha' },
  { nome: 'Dados', href: caminho.dados(), ativa: (r) => r.nome === 'dados' },
  { nome: 'Compêndio', href: caminho.compendio(), ativa: (r) => r.nome === 'compendio' },
]

/** Abas principais do topo (nas páginas de primeiro nível). */
function Abas() {
  const rota = useRota()
  return (
    <nav className="abas" aria-label="Seções">
      {ABAS.map((a) => (
        <a key={a.nome} className="abas__aba" href={a.href} aria-current={a.ativa(rota) ? 'page' : undefined}>
          {a.nome}
        </a>
      ))}
    </nav>
  )
}
