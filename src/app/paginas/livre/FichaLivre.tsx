import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { exportarModelo, livres, useFichasLivres, useModelos } from '../../../universal/armazenamento'
import { atualDoRecurso, calcularFichaLivre, expressaoDaRolagem, type Calculo, type Campo, type FichaLivre, type Modelo } from '../../../universal/modelo'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import { useRolador } from '../../componentes/Rolador'
import { Topo } from '../../componentes/Topo'
import { caminho, irPara } from '../../rotas'
import { baixarArquivo, nomeDeArquivo } from '../../util'

const formatar = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','))

export function FichaLivreSomenteLeitura({ ficha, modelo, voltarPara, acoesExtras }: { ficha: FichaLivre; modelo: Modelo; voltarPara: string; acoesExtras?: ReactNode }) {
  return <Ficha ficha={ficha} modelo={modelo} somenteLeitura voltarPara={voltarPara} acoesExtras={acoesExtras} />
}

export function PaginaFichaLivre({ id }: { id: string }) {
  const fichas = useFichasLivres()
  const modelos = useModelos()
  const ficha = fichas.find((f) => f.id === id)
  const modelo = ficha && modelos.find((m) => m.id === ficha.modeloId)

  useEffect(() => {
    document.title = ficha ? `${ficha.nome} · Tomo` : 'Tomo'
    return () => {
      document.title = 'Tomo'
    }
  }, [ficha])

  if (!ficha || !modelo) {
    return (
      <>
        <Topo voltarPara={caminho.lista()} titulo="Ficha" />
        <main id="conteudo" tabIndex={-1} className="pagina vazio">
          <h1>Ficha não encontrada</h1>
          <p className="suave">Ela ou o modelo dela podem ter sido excluídos.</p>
          <a className="botao" href={caminho.lista()}>
            Ver personagens
          </a>
        </main>
      </>
    )
  }
  return <Ficha key={ficha.id} ficha={ficha} modelo={modelo} />
}

function Ficha({
  ficha,
  modelo,
  somenteLeitura = false,
  voltarPara = caminho.lista(),
  acoesExtras,
}: {
  ficha: FichaLivre
  modelo: Modelo
  somenteLeitura?: boolean
  voltarPara?: string
  acoesExtras?: ReactNode
}) {
  const calculo = useMemo(() => calcularFichaLivre(modelo, ficha.valores), [modelo, ficha.valores])
  const abas = modelo.secoes.filter((s) => modelo.campos.some((c) => c.secao === s))
  const [aba, setAba] = useState(abas[0] ?? '')
  const abaAtual = abas.includes(aba) ? aba : (abas[0] ?? '')
  const [excluindo, setExcluindo] = useState(false)

  const mudar = (campoId: string, valor: unknown) => {
    if (!somenteLeitura) livres.salvarFicha({ ...ficha, valores: { ...ficha.valores, [campoId]: valor } })
  }

  return (
    <>
      <Topo
        voltarPara={voltarPara}
        titulo={ficha.nome}
        acoes={
          somenteLeitura ? (
            acoesExtras
          ) : (
          <a className="botao botao--fantasma" href={caminho.modelo(modelo.id)} aria-label="Editar modelo">
            <Icone nome="ajustes" />
            <span className="so-largo">Editar modelo</span>
            <span className="so-estreito" aria-hidden="true">
              Modelo
            </span>
          </a>
          )
        }
      />
      <main id="conteudo" tabIndex={-1} className="pagina ficha ficha-livre">
        <header className="ficha__cabeca">
          <div className="ficha__titulo">
            <p className="rotulo">{modelo.nome}</p>
            {somenteLeitura ? (
              <h1 className="ficha-livre__nome">{ficha.nome}</h1>
            ) : (
              <input
                className="ficha-livre__nome"
                value={ficha.nome}
                onChange={(e) => livres.salvarFicha({ ...ficha, nome: e.target.value })}
                aria-label="Nome do personagem"
              />
            )}
          </div>
          {!somenteLeitura && (
          <div className="acoes">
            <button
              type="button"
              className="botao botao--fantasma botao--icone"
              onClick={() => baixarArquivo(`${nomeDeArquivo(ficha.nome)}.json`, exportarModelo(modelo, [ficha]))}
              aria-label="Exportar ficha (com o modelo)"
              title="Exportar ficha com o modelo"
            >
              <Icone nome="baixar" />
            </button>
            <button type="button" className="botao botao--fantasma botao--icone" onClick={() => setExcluindo(true)} aria-label="Excluir ficha" title="Excluir">
              <Icone nome="lixo" />
            </button>
          </div>
          )}
        </header>
        {somenteLeitura && <p className="suave">Só leitura: ficha de {modelo.nome} de um jogador da mesa. As rolagens continuam funcionando.</p>}

        {abas.length > 1 && (
          <nav className="abas-ficha" aria-label="Seções da ficha">
            {abas.map((s) => (
              <button key={s} type="button" className="abas-ficha__aba" aria-current={s === abaAtual ? 'page' : undefined} onClick={() => setAba(s)}>
                {s}
              </button>
            ))}
          </nav>
        )}

        {modelo.campos.length === 0 ? (
          <div className="vazio">
            <p className="suave">O modelo ainda não tem campos.</p>
            <a className="botao" href={caminho.modelo(modelo.id)}>
              Montar o modelo
            </a>
          </div>
        ) : (
          <div className="painel painel--livre">
            {modelo.campos
              .filter((c) => c.secao === abaAtual)
              .map((c) => (
                <section key={c.id} className={`bloco-ficha campo-livre campo-livre--${c.largura}`} aria-labelledby={`cl-${c.id}`}>
                  <header className="bloco-ficha__cabeca">
                    <h2 id={`cl-${c.id}`} className="bloco-ficha__titulo">
                      {c.rotulo}
                    </h2>
                  </header>
                  <div className="bloco-ficha__corpo">
                    <ValorDoCampo bloqueado={somenteLeitura} campo={c} valor={ficha.valores[c.id]} calculo={calculo} aoMudar={(v) => mudar(c.id, v)} valores={ficha.valores} />
                    {calculo.erros[c.id] && <p className="aviso">{calculo.erros[c.id]}</p>}
                    {c.ajuda && <p className="campo__ajuda">{c.ajuda}</p>}
                  </div>
                </section>
              ))}
          </div>
        )}
      </main>

      <Dialogo
        aberto={excluindo}
        titulo="Excluir ficha"
        aoFechar={() => setExcluindo(false)}
        rodape={
          <>
            <button type="button" className="botao" onClick={() => setExcluindo(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao--perigo"
              onClick={() => {
                livres.excluirFicha(ficha.id)
                irPara(caminho.lista(), true)
              }}
            >
              <Icone nome="lixo" />
              Excluir
            </button>
          </>
        }
      >
        <p>
          <strong>{ficha.nome}</strong> será apagada deste aparelho. O modelo continua.
        </p>
      </Dialogo>
    </>
  )
}

/** Na ficha só de leitura, tudo fica travado, menos as rolagens. */
function ValorDoCampo({ bloqueado, ...props }: PropsValor & { bloqueado: boolean }) {
  if (!bloqueado || props.campo.tipo === 'rolagem') return <ValorEditavel {...props} />
  return (
    <fieldset className="sem-moldura" disabled>
      <ValorEditavel {...props} />
    </fieldset>
  )
}

interface PropsValor {
  campo: Campo
  valor: unknown
  valores: FichaLivre['valores']
  calculo: Calculo
  aoMudar: (v: unknown) => void
}

function ValorEditavel({
  campo: c,
  valor,
  valores,
  calculo,
  aoMudar,
}: PropsValor) {
  const { rolar } = useRolador()
  switch (c.tipo) {
    case 'texto':
      return <input value={typeof valor === 'string' ? valor : ''} onChange={(e) => aoMudar(e.target.value)} aria-label={c.rotulo} />
    case 'textoLongo':
      return <textarea rows={5} value={typeof valor === 'string' ? valor : ''} onChange={(e) => aoMudar(e.target.value)} aria-label={c.rotulo} />
    case 'marcador':
      return (
        <label className="alternar">
          <input type="checkbox" checked={valor === true} onChange={(e) => aoMudar(e.target.checked)} />
          {valor === true ? 'Sim' : 'Não'}
        </label>
      )
    case 'numero': {
      const n = typeof valor === 'number' ? valor : (c.padrao ?? 0)
      return (
        <div className="livre-numero">
          <button type="button" className="pv__botao" onClick={() => aoMudar(n - 1)} aria-label={`Diminuir ${c.rotulo}`}>
            <Icone nome="menos" />
          </button>
          <input
            className="livre-numero__valor numeros"
            type="number"
            inputMode="numeric"
            value={n}
            onChange={(e) => aoMudar(Number(e.target.value) || 0)}
            aria-label={c.rotulo}
          />
          <button type="button" className="pv__botao" onClick={() => aoMudar(n + 1)} aria-label={`Aumentar ${c.rotulo}`}>
            <Icone nome="mais" />
          </button>
        </div>
      )
    }
    case 'formula':
      return <p className="livre-formula numeros">{formatar(calculo.porChave[c.chave] ?? 0)}</p>
    case 'recurso': {
      const max = Math.max(0, Math.trunc(calculo.expressoes[c.id] ?? 0))
      const atual = atualDoRecurso(c, valores)
      const pct = max ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0
      return (
        <div className="pv">
          <div className="pv__linha">
            <button type="button" className="pv__botao" onClick={() => aoMudar(Math.max(0, atual - 1))} aria-label={`Diminuir ${c.rotulo}`} disabled={atual <= 0}>
              <Icone nome="menos" tamanho={24} />
            </button>
            <span className="pv__valor numeros">
              <strong>{atual}</strong>
              <span className="suave">/{max}</span>
            </span>
            <button type="button" className="pv__botao" onClick={() => aoMudar(atual + 1)} aria-label={`Aumentar ${c.rotulo}`}>
              <Icone nome="mais" tamanho={24} />
            </button>
          </div>
          <span className="medidor" aria-hidden="true">
            <span style={{ inlineSize: `${pct}%` }} className={pct <= 25 ? 'medidor--perigo' : pct <= 50 ? 'medidor--alerta' : ''} />
          </span>
          {atual < max && (
            <div className="pv__rodape">
              <span />
              <button type="button" className="botao pv__encher" onClick={() => aoMudar(max)}>
                Encher
              </button>
            </div>
          )}
        </div>
      )
    }
    case 'rolagem': {
      const expressao = expressaoDaRolagem(c, calculo)
      return (
        <button type="button" className="botao livre-rolagem" disabled={!expressao} onClick={() => expressao && rolar(expressao, { rotulo: c.rotulo })}>
          <Icone nome="d20" />
          <span className="numeros">{expressao ?? '—'}</span>
        </button>
      )
    }
    case 'lista':
      return <ListaLivre itens={Array.isArray(valor) ? valor.filter((x): x is string => typeof x === 'string') : []} aoMudar={aoMudar} rotulo={c.rotulo} />
  }
}

function ListaLivre({ itens, aoMudar, rotulo }: { itens: string[]; aoMudar: (v: string[]) => void; rotulo: string }) {
  const [novo, setNovo] = useState('')
  const adicionar = () => {
    if (!novo.trim()) return
    aoMudar([...itens, novo.trim()])
    setNovo('')
  }
  return (
    <div className="livre-lista">
      {itens.length > 0 && (
        <ul>
          {itens.map((item, i) => (
            <li key={`${i}-${item}`}>
              <input value={item} onChange={(e) => aoMudar(itens.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`${rotulo}: item ${i + 1}`} />
              <button type="button" className="botao botao--fantasma botao--icone" onClick={() => aoMudar(itens.filter((_, j) => j !== i))} aria-label={`Remover ${item}`}>
                <Icone nome="lixo" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="livre-lista__novo">
        <input
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') adicionar()
          }}
          placeholder="Novo item…"
          aria-label={`Novo item em ${rotulo}`}
        />
        <button type="button" className="botao" onClick={adicionar}>
          <Icone nome="mais" />
          Adicionar
        </button>
      </div>
    </div>
  )
}
