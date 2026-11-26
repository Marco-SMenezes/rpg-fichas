import { useState } from 'react'
import { aprovarConta, listarContas, recusarConta, type ContaDoTomo } from '../../nuvem/nuvem'
import { Dialogo } from '../componentes/Dialogo'
import { Topo } from '../componentes/Topo'
import { useNuvem } from '../estado'
import { caminho } from '../rotas'
import { useCarga } from './campanhas/usarCarga'

function data(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/** Página do dono do Tomo: aprova ou recusa pedidos de conta. */
export function Contas() {
  const nuvem = useNuvem()
  const { dados, erro, carregando, recarregar } = useCarga(
    () => (nuvem.status === 'logado' && nuvem.admin ? listarContas() : Promise.resolve(null)),
    [nuvem.status, nuvem.admin],
  )
  const [confirmando, setConfirmando] = useState<ContaDoTomo | null>(null)
  const [mensagem, setMensagem] = useState('')

  const agir = async (f: () => Promise<void>, texto: string) => {
    setMensagem('')
    try {
      await f()
      setMensagem(texto)
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : 'Algo deu errado.')
    }
    await recarregar()
  }

  const pedidos = (dados ?? []).filter((c) => !c.aprovado)
  const aprovadas = (dados ?? []).filter((c) => c.aprovado)

  return (
    <>
      <Topo voltarPara={caminho.lista()} titulo="Contas" />
      <main id="conteudo" tabIndex={-1} className="pagina contas">
        <div className="lista__cabeca">
          <div>
            <h1>Pedidos de conta</h1>
            <p className="suave">Só contas aprovadas usam a nuvem e as campanhas.</p>
          </div>
          <button type="button" className="botao" onClick={() => void recarregar()} disabled={carregando}>
            {carregando ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
        {!nuvem.admin && nuvem.status === 'logado' && <p className="aviso">Só o dono do Tomo vê esta página.</p>}
        {erro && <p className="aviso">{erro}</p>}
        <p className="lista__mensagem" role="status" aria-live="polite">
          {mensagem}
        </p>

        {nuvem.admin && (
          <>
            <section className="bloco">
              <h2>Esperando aprovação ({pedidos.length})</h2>
              {pedidos.length === 0 && <p className="suave">Nenhum pedido agora.</p>}
              <ul className="mesa">
                {pedidos.map((c) => (
                  <li key={c.usuario} className="mesa__membro">
                    <span className="mesa__texto">
                      <strong>{c.nome || 'Sem nome'}</strong>
                      <span className="suave">
                        {c.email} · pediu em {data(c.criado_em)}
                      </span>
                    </span>
                    <button type="button" className="botao botao--primario" onClick={() => void agir(() => aprovarConta(c.usuario), `${c.nome || c.email} aprovado.`)}>
                      Aprovar
                    </button>
                    <button type="button" className="botao botao--perigo" onClick={() => setConfirmando(c)}>
                      Recusar
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bloco">
              <h2>Aprovadas ({aprovadas.length})</h2>
              <ul className="mesa">
                {aprovadas.map((c) => (
                  <li key={c.usuario} className="mesa__membro">
                    <span className="mesa__texto">
                      <strong>
                        {c.nome || 'Sem nome'}
                        {c.admin ? ' · dono' : ''}
                      </strong>
                      <span className="suave numeros">
                        {c.email} · {c.fichas} {c.fichas === 1 ? 'ficha' : 'fichas'} · {c.campanhas} {c.campanhas === 1 ? 'campanha' : 'campanhas'}
                      </span>
                    </span>
                    {!c.admin && (
                      <button type="button" className="botao botao--fantasma" onClick={() => setConfirmando(c)}>
                        Tirar acesso
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </main>

      <Dialogo
        aberto={!!confirmando}
        titulo={confirmando?.aprovado ? 'Tirar acesso' : 'Recusar pedido'}
        aoFechar={() => setConfirmando(null)}
        rodape={
          <>
            <button type="button" className="botao" onClick={() => setConfirmando(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao--perigo"
              onClick={() => {
                const c = confirmando
                setConfirmando(null)
                if (c) void agir(() => recusarConta(c.usuario), c.aprovado ? `Acesso de ${c.nome || c.email} retirado.` : 'Pedido recusado.')
              }}
            >
              {confirmando?.aprovado ? 'Tirar acesso' : 'Recusar e apagar a conta'}
            </button>
          </>
        }
      >
        <p>
          {confirmando?.aprovado
            ? 'A pessoa continua com a conta, mas volta a ficar sem acesso à nuvem e às campanhas. As fichas dela ficam guardadas.'
            : 'A conta pedida é apagada. Se for engano, a pessoa pode pedir de novo.'}
        </p>
      </Dialogo>
    </>
  )
}
