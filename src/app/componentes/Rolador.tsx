import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { interpretar, rolar as rolarExpressao, type Modo, type Rolagem } from '../../rolagem/rolagem'
import { Contador } from './Contador'
import { Dialogo } from './Dialogo'
import { Icone } from './Icone'

const CHAVE_HISTORICO = 'tomo:historico:v1'
const MAX_HISTORICO = 50

interface OpcoesRolar {
  rotulo?: string
  modo?: Modo
  critico?: boolean
}

interface Contexto {
  rolar: (expressao: string, opcoes?: OpcoesRolar) => void
  modo: Modo
  setModo: (m: Modo) => void
}

const RoladorContexto = createContext<Contexto | null>(null)

export function useRolador(): Contexto {
  const c = useContext(RoladorContexto)
  if (!c) throw new Error('useRolador fora do RoladorProvider')
  return c
}

function lerHistorico(): Rolagem[] {
  try {
    const bruto = localStorage.getItem(CHAVE_HISTORICO)
    const lista: unknown = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? (lista as Rolagem[]) : []
  } catch {
    return []
  }
}

function gravarHistorico(lista: Rolagem[]) {
  try {
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(lista))
  } catch {
    /* sem armazenamento: histórico só nesta sessão */
  }
}

const NOME_MODO: Record<Modo, string> = { normal: 'Normal', vantagem: 'Vantagem', desvantagem: 'Desvantagem' }

export function RoladorProvider({ children }: { children: ReactNode }) {
  const [historico, setHistorico] = useState<Rolagem[]>(lerHistorico)
  const [modo, setModo] = useState<Modo>('normal')
  const [ultima, setUltima] = useState<Rolagem | null>(null)
  const [painel, setPainel] = useState(false)

  useEffect(() => gravarHistorico(historico), [historico])

  const rolar = useCallback(
    (expressao: string, opcoes: OpcoesRolar = {}) => {
      const usaD20 = interpretar(expressao)?.dados.some((d) => d.lados === 20 && d.quantidade === 1) ?? false
      const modoUsado = opcoes.modo ?? (usaD20 ? modo : 'normal')
      const r = rolarExpressao(expressao, { rotulo: opcoes.rotulo, modo: modoUsado, critico: opcoes.critico })
      if (!r) return
      setUltima(r)
      setHistorico((h) => [r, ...h].slice(0, MAX_HISTORICO))
      // Vantagem/desvantagem vale para uma rolagem de d20 e depois volta ao normal.
      if (usaD20 && !opcoes.modo) setModo('normal')
    },
    [modo],
  )

  const valor = useMemo(() => ({ rolar, modo, setModo }), [rolar, modo])

  return (
    <RoladorContexto.Provider value={valor}>
      {children}
      <ResultadoFlutuante rolagem={ultima} aoFechar={() => setUltima(null)} />
      <nav className="barra-dados" aria-label="Rolador de dados">
        <div className="barra-dados__dentro">
          <div className="segmentos" role="group" aria-label="Próxima rolagem de d20">
            {(['desvantagem', 'normal', 'vantagem'] as const).map((m) => (
              <button key={m} type="button" aria-pressed={modo === m} onClick={() => setModo(m)}>
                {m === 'normal' ? 'Normal' : m === 'vantagem' ? 'Vant.' : 'Desv.'}
              </button>
            ))}
          </div>
          <button type="button" className="botao botao--primario" onClick={() => setPainel(true)}>
            <Icone nome="d20" />
            Dados
          </button>
        </div>
      </nav>
      <PainelRolador
        aberto={painel}
        aoFechar={() => setPainel(false)}
        historico={historico}
        aoLimpar={() => setHistorico([])}
        aoRolar={(e) => rolar(e, { rotulo: 'Rolagem livre' })}
        modo={modo}
      />
    </RoladorContexto.Provider>
  )
}

function DetalheDados({ r }: { r: Rolagem }) {
  return (
    <span className="rolagem__dados numeros">
      {r.dados.map((d, i) => (
        <span
          key={i}
          className={[
            'dado',
            d.descartado ? 'dado--descartado' : '',
            d.lados === 20 && d.valor === 20 && !d.descartado ? 'dado--max' : '',
            d.lados === 20 && d.valor === 1 && !d.descartado ? 'dado--min' : '',
          ].join(' ')}
          title={`d${d.lados}`}
        >
          {d.valor}
        </span>
      ))}
      {r.modificador !== 0 && (
        <span className="rolagem__mod">
          {r.modificador > 0 ? '+' : '−'}
          {Math.abs(r.modificador)}
        </span>
      )}
    </span>
  )
}

function descricao(r: Rolagem): string {
  const partes = [r.expressao]
  if (r.modo !== 'normal') partes.push(NOME_MODO[r.modo].toLowerCase())
  if (r.critico) partes.push('crítico')
  return partes.join(' · ')
}

/**
 * Com um diálogo aberto (ex.: a janela de ataque), o resultado é desenhado
 * dentro dele: assim fica na frente e o botão de fechar continua tocável.
 * Nesse caso vai para o topo da tela, para não cobrir os botões de rolar.
 */
function ResultadoFlutuante({ rolagem, aoFechar }: { rolagem: Rolagem | null; aoFechar: () => void }) {
  const [destino, setDestino] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setDestino(rolagem ? document.querySelector<HTMLElement>('dialog[open]') : null)
  }, [rolagem])

  if (!rolagem) return <div className="visualmente-oculto" aria-live="polite" />
  const natural = rolagem.d20 === 20 ? '20 natural' : rolagem.d20 === 1 ? '1 natural' : null
  const conteudo = (
    <div key={rolagem.total + rolagem.rotulo} className={`resultado ${destino ? 'resultado--topo' : ''}`} role="status" aria-live="polite">
      <div className="resultado__texto">
        <span className="resultado__rotulo">{rolagem.rotulo || 'Rolagem'}</span>
        <span className="resultado__descricao">{descricao(rolagem)}</span>
        <DetalheDados r={rolagem} />
      </div>
      <div className={`resultado__total numeros ${natural ? (rolagem.d20 === 20 ? 'e-max' : 'e-min') : ''}`}>
        {rolagem.total}
        {natural && <span className="resultado__natural">{natural}</span>}
      </div>
      <button type="button" className="botao botao--fantasma botao--icone" onClick={aoFechar} aria-label="Fechar resultado">
        <Icone nome="fechar" />
      </button>
    </div>
  )
  return destino ? createPortal(conteudo, destino) : conteudo
}

const DADOS = [4, 6, 8, 10, 12, 20, 100]

function PainelRolador({
  aberto,
  aoFechar,
  historico,
  aoLimpar,
  aoRolar,
  modo,
}: {
  aberto: boolean
  aoFechar: () => void
  historico: Rolagem[]
  aoLimpar: () => void
  aoRolar: (expressao: string) => void
  modo: Modo
}) {
  const [quantidade, setQuantidade] = useState(1)
  const [modificador, setModificador] = useState(0)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')

  const montar = (lados: number) =>
    `${quantidade}d${lados}${modificador === 0 ? '' : modificador > 0 ? `+${modificador}` : modificador}`

  return (
    <Dialogo aberto={aberto} titulo="Rolador de dados" aoFechar={aoFechar}>
      <div className="painel-dados">
        <div className="painel-dados__ajustes">
          <div className="campo">
            <span className="rotulo">Quantidade</span>
            <Contador rotulo="quantidade de dados" valor={quantidade} min={1} max={20} aoMudar={setQuantidade} />
          </div>
          <div className="campo">
            <span className="rotulo">Modificador</span>
            <Contador rotulo="modificador" valor={modificador} min={-20} max={20} aoMudar={setModificador} />
          </div>
        </div>
        <div className="painel-dados__grade">
          {DADOS.map((lados) => (
            <button key={lados} type="button" className="botao botao-dado" onClick={() => aoRolar(montar(lados))}>
              <span className="numeros">d{lados}</span>
            </button>
          ))}
        </div>
        {modo !== 'normal' && (
          <p className="nota">A próxima rolagem de 1d20 será com {NOME_MODO[modo].toLowerCase()}.</p>
        )}
        <form
          className="painel-dados__livre"
          onSubmit={(e) => {
            e.preventDefault()
            if (!interpretar(texto)) {
              setErro('Use o formato 2d6+3, 1d20-1 ou 1d8+1d6.')
              return
            }
            setErro('')
            aoRolar(texto)
          }}
        >
          <label className="campo">
            <span className="rotulo">Expressão</span>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="2d6+3…"
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              aria-invalid={!!erro}
              aria-describedby="erro-expressao"
            />
          </label>
          <button type="submit" className="botao botao--primario">
            Rolar
          </button>
        </form>
        <p id="erro-expressao" className="campo__ajuda" aria-live="polite">
          {erro}
        </p>
      </div>
      <section className="historico" aria-labelledby="titulo-historico">
        <div className="bloco__cabeca">
          <h3 id="titulo-historico">Histórico</h3>
          {historico.length > 0 && (
            <button type="button" className="botao botao--fantasma" onClick={aoLimpar}>
              Limpar
            </button>
          )}
        </div>
        {historico.length === 0 ? (
          <p className="suave">Nenhuma rolagem ainda.</p>
        ) : (
          <ol className="historico__lista">
            {historico.map((r, i) => (
              <li key={i} className="historico__item">
                <div className="historico__texto">
                  <span className="historico__rotulo">{r.rotulo || 'Rolagem'}</span>
                  <span className="suave">{descricao(r)}</span>
                  <DetalheDados r={r} />
                </div>
                <span className="historico__total numeros">{r.total}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Dialogo>
  )
}
