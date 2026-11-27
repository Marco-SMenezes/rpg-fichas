import { useEffect, useState } from 'react'
import { blocosDoCartao, cartoesPadrao, moverCartao, normalizarCartoes, novoCartao, type Cartao } from '../../../escudo/cartoes'
import { lerEscudo, salvarCartoes, salvarNotasDoMestre, type MinhaCampanha } from '../../../nuvem/campanhas'
import { DetalheDados, useRolador } from '../../componentes/Rolador'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import { CampoNotas } from './Campanha'
import { useCarga } from './usarCarga'

/** Escudo do mestre: rolagens secretas, anotações só dele e cartões de consulta. */
export function Escudo({ c }: { c: MinhaCampanha }) {
  const escudo = useCarga(() => lerEscudo(c.id), [c.id])
  const { historico, secretaPorPadrao, definirSecretaPorPadrao } = useRolador()
  const [mostrar, setMostrar] = useState(false)

  // No escudo, as rolagens do mestre são secretas; ao sair, voltam a ir para a mesa.
  useEffect(() => {
    definirSecretaPorPadrao(!mostrar)
    return () => definirSecretaPorPadrao(false)
  }, [mostrar, definirSecretaPorPadrao])

  const secretas = historico.filter((r) => r.secreta).slice(0, 12)

  return (
    <div className="escudo">
      <section className="bloco escudo__rolagens" aria-labelledby="t-secretas">
        <h2 id="t-secretas">Rolagens secretas</h2>
        <label className="alternar">
          <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} />
          Mostrar para a mesa
        </label>
        <p className="campo__ajuda">
          {secretaPorPadrao
            ? 'Use o botão Dados: aqui (e na aba Combate) suas rolagens ficam só com você.'
            : 'Ligado: as próximas rolagens vão para a mesa.'}
        </p>
        {secretas.length === 0 ? (
          <p className="suave">Nenhuma rolagem secreta ainda.</p>
        ) : (
          <ol className="historico__lista escudo__secretas">
            {secretas.map((r, i) => (
              <li key={i} className="historico__item">
                <span className="historico__texto">
                  <strong>{r.rotulo || r.expressao}</strong>
                  <DetalheDados r={r} />
                </span>
                <span className="historico__total numeros">{r.total}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="bloco" aria-labelledby="t-notas-mestre">
        <h2 id="t-notas-mestre">Anotações</h2>
        {escudo.dados ? (
          <CampoNotas
            titulo="Só do mestre"
            ajuda="Ninguém mais vê. Salva ao sair do campo."
            inicial={escudo.dados.texto}
            salvar={(t) => salvarNotasDoMestre(c.id, t)}
          />
        ) : (
          <p className="suave">{escudo.erro || 'Carregando…'}</p>
        )}
      </section>

      {escudo.dados && <Cartoes c={c} inicial={normalizarCartoes(escudo.dados.cartoes, c.sistema)} />}
    </div>
  )
}

function Cartoes({ c, inicial }: { c: MinhaCampanha; inicial: Cartao[] }) {
  const [cartoes, setCartoes] = useState(inicial)
  const [editando, setEditando] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [estado, setEstado] = useState('')

  const salvar = (l: Cartao[]) => {
    setCartoes(l)
    setEstado('Salvando…')
    salvarCartoes(c.id, l)
      .then(() => setEstado('Salvo.'))
      .catch((e: Error) => setEstado(e.message))
  }
  const trocar = (id: string, parte: Partial<Cartao>) => setCartoes((l) => l.map((x) => (x.id === id ? { ...x, ...parte } : x)))
  const visiveis = cartoes.filter((x) => editando || !x.oculto)

  return (
    <section className="bloco" aria-labelledby="t-cartoes">
      <div className="bloco__cabeca">
        <h2 id="t-cartoes">Consulta rápida</h2>
        <button type="button" className="botao" aria-pressed={editando} onClick={() => setEditando(!editando)}>
          <Icone nome="ajustes" />
          {editando ? 'Pronto' : 'Editar cartões'}
        </button>
      </div>
      {estado && (
        <p className="campo__ajuda" aria-live="polite">
          {estado}
        </p>
      )}
      {cartoes.length === 0 && !editando && (
        <p className="suave">Nenhum cartão. Toque em "Editar cartões" para criar os seus{c.sistema === 'dnd5e' ? ' ou restaurar os padrões' : ''}.</p>
      )}

      <div className="escudo__cartoes">
        {visiveis.map((x) => (
          <article key={x.id} className={`escudo__cartao${x.oculto ? ' escudo__cartao--oculto' : ''}`}>
            {editando ? (
              <>
                <input
                  className="escudo__titulo-edicao"
                  value={x.titulo}
                  aria-label={`Título do cartão ${x.titulo}`}
                  onChange={(e) => trocar(x.id, { titulo: e.target.value })}
                  onBlur={() => salvar(cartoes)}
                />
                <textarea
                  rows={8}
                  value={x.texto}
                  aria-label={`Texto do cartão ${x.titulo}`}
                  onChange={(e) => trocar(x.id, { texto: e.target.value })}
                  onBlur={() => salvar(cartoes)}
                />
                <div className="escudo__acoes">
                  <button
                    type="button"
                    className="botao botao--fantasma botao--icone"
                    onClick={() => salvar(moverCartao(cartoes, x.id, -1))}
                    aria-label={`Subir ${x.titulo}`}
                    title="Subir"
                  >
                    <Icone nome="subir" />
                  </button>
                  <button
                    type="button"
                    className="botao botao--fantasma botao--icone"
                    onClick={() => salvar(moverCartao(cartoes, x.id, 1))}
                    aria-label={`Descer ${x.titulo}`}
                    title="Descer"
                  >
                    <Icone nome="baixar" />
                  </button>
                  <button
                    type="button"
                    className="botao botao--fantasma"
                    aria-pressed={x.oculto}
                    onClick={() => salvar(cartoes.map((y) => (y.id === x.id ? { ...y, oculto: !y.oculto } : y)))}
                  >
                    <Icone nome="olho" />
                    {x.oculto ? 'Mostrar' : 'Ocultar'}
                  </button>
                  <button
                    type="button"
                    className="botao botao--fantasma botao--icone"
                    onClick={() => salvar(cartoes.filter((y) => y.id !== x.id))}
                    aria-label={`Apagar ${x.titulo}`}
                    title="Apagar"
                  >
                    <Icone nome="lixo" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>{x.titulo}</h3>
                <ConteudoDoCartao texto={x.texto} />
              </>
            )}
          </article>
        ))}
      </div>

      {editando && (
        <div className="acoes">
          <button type="button" className="botao" onClick={() => salvar([...cartoes, novoCartao()])}>
            <Icone nome="mais" />
            Adicionar cartão
          </button>
          {c.sistema === 'dnd5e' && (
            <button type="button" className="botao botao--fantasma" onClick={() => setRestaurando(true)}>
              Restaurar padrão
            </button>
          )}
        </div>
      )}

      <Dialogo
        aberto={restaurando}
        titulo="Restaurar os cartões padrão"
        aoFechar={() => setRestaurando(false)}
        rodape={
          <>
            <button type="button" className="botao" onClick={() => setRestaurando(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao--perigo"
              onClick={() => {
                setRestaurando(false)
                salvar(cartoesPadrao(c.sistema))
              }}
            >
              Restaurar
            </button>
          </>
        }
      >
        <p>Os cartões voltam a ser os padrão do Tomo. Os que você criou ou editou somem.</p>
      </Dialogo>
    </section>
  )
}

function ConteudoDoCartao({ texto }: { texto: string }) {
  const blocos = blocosDoCartao(texto)
  if (!blocos.length) return <p className="suave">Vazio.</p>
  return (
    <>
      {blocos.map((b, i) =>
        b.tipo === 'paragrafo' ? (
          <p key={i}>{b.texto}</p>
        ) : (
          <div key={i} className="escudo__tabela">
            <table>
              <thead>
                <tr>
                  {b.cabecalho.map((h, j) => (
                    <th key={j} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.linhas.map((l, j) => (
                  <tr key={j}>
                    {l.map((cel, k) => (
                      <td key={k}>{cel}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </>
  )
}
