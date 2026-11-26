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
  /** Rola, mostra o resultado e devolve a rolagem (ou null se a expressão for inválida). */
  rolar: (expressao: string, opcoes?: OpcoesRolar) => Rolagem | null
  modo: Modo
  setModo: (m: Modo) => void
  historico: Rolagem[]
  limparHistorico: () => void
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

export function RoladorProvider({
  children,
  mostrarBarra = true,
  aoRolar,
}: {
  children: ReactNode
  mostrarBarra?: boolean
  /** Chamado a cada rolagem (ex.: compartilhar com a campanha). */
  aoRolar?: (r: Rolagem) => void
}) {
  const [historico, setHistorico] = useState<Rolagem[]>(lerHistorico)
  const [modo, setModo] = useState<Modo>('normal')
  const [ultima, setUltima] = useState<Rolagem | null>(null)
  const [painel, setPainel] = useState(false)

  useEffect(() => gravarHistorico(historico), [historico])

  // Sem a barra, o espaço reservado para ela no rodapé some (variável --barra-inferior).
  useEffect(() => {
    document.documentElement.classList.toggle('sem-barra-dados', !mostrarBarra)
  }, [mostrarBarra])

  const rolar = useCallback(
    (expressao: string, opcoes: OpcoesRolar = {}) => {
      const usaD20 = interpretar(expressao)?.dados.some((d) => d.lados === 20 && d.quantidade === 1) ?? false
      const modoUsado = opcoes.modo ?? (usaD20 ? modo : 'normal')
      const r = rolarExpressao(expressao, { rotulo: opcoes.rotulo, modo: modoUsado, critico: opcoes.critico })
      if (!r) return null
      setUltima(r)
      setHistorico((h) => [r, ...h].slice(0, MAX_HISTORICO))
      aoRolar?.(r)
      // Vantagem/desvantagem vale para uma rolagem de d20 e depois volta ao normal.
      if (usaD20 && !opcoes.modo) setModo('normal')
      return r
    },
    [modo, aoRolar],
  )

  const limparHistorico = useCallback(() => setHistorico([]), [])
  const valor = useMemo(() => ({ rolar, modo, setModo, historico, limparHistorico }), [rolar, modo, historico, limparHistorico])

  return (
    <RoladorContexto.Provider value={valor}>
      {children}
      <ResultadoFlutuante rolagem={ultima} aoFechar={() => setUltima(null)} />
      {mostrarBarra && (
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
      )}
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

export function DetalheDados({ r }: { r: Rolagem }) {
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
  if (r.sucessos) partes.push(r.total === 1 ? '1 sucesso' : `${r.total} sucessos`)
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

type TipoResultado = 'soma' | 'maior' | 'menor' | 'maiores' | 'menores' | 'sucessos'
const RESULTADOS: [TipoResultado, string][] = [
  ['soma', 'Soma'],
  ['maior', 'Maior'],
  ['menor', 'Menor'],
  ['maiores', 'N maiores'],
  ['menores', 'N menores'],
  ['sucessos', 'Sucessos'],
]
const AJUDA_RESULTADO: Record<TipoResultado, string> = {
  soma: 'Soma todos os dados. Na expressão: 4d6.',
  maior: 'Fica só com o maior dado. Na expressão: 4d6kh1.',
  menor: 'Fica só com o menor dado. Na expressão: 4d6kl1.',
  maiores: 'Soma só os maiores (ex.: 4d6, os 3 maiores, para criar atributos). Na expressão: 4d6kh3.',
  menores: 'Soma só os menores. Na expressão: 4d6kl2.',
  sucessos: 'Conta quantos dados chegaram ao valor escolhido; o modificador não entra. Na expressão: 6d6>=5.',
}

function PainelRolador({
  aberto,
  aoFechar,
  ...resto
}: {
  aberto: boolean
  aoFechar: () => void
} & PropsConteudo) {
  return (
    <Dialogo aberto={aberto} titulo="Rolador de dados" aoFechar={aoFechar}>
      <ConteudoRolador {...resto} />
    </Dialogo>
  )
}

interface PropsConteudo {
  historico: Rolagem[]
  aoLimpar: () => void
  aoRolar: (expressao: string) => void
  modo: Modo
}

/** Dados, expressão livre e histórico: usado no painel do rodapé e na aba Dados. */
export function ConteudoRolador({ historico, aoLimpar, aoRolar, modo }: PropsConteudo) {
  const [quantidade, setQuantidade] = useState(1)
  const [modificador, setModificador] = useState(0)
  const [resultado, setResultado] = useState<TipoResultado>('soma')
  const [quantos, setQuantos] = useState(2)
  const [alvo, setAlvo] = useState(5)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')

  const montar = (lados: number) => {
    const n = Math.min(quantos, quantidade)
    const regra = {
      soma: '',
      maior: 'kh1',
      menor: 'kl1',
      maiores: `kh${n}`,
      menores: `kl${n}`,
      sucessos: `>=${Math.min(alvo, lados)}`,
    }[resultado]
    const mod = resultado === 'sucessos' || modificador === 0 ? '' : modificador > 0 ? `+${modificador}` : `${modificador}`
    return `${quantidade}d${lados}${quantidade > 1 || resultado === 'sucessos' ? regra : ''}${mod}`
  }

  return (
    <>
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
        <div className="campo">
          <span className="rotulo">Resultado</span>
          <div className="segmentos segmentos--cheio" role="group" aria-label="Como contar o resultado">
            {RESULTADOS.map(([id, nome]) => (
              <button key={id} type="button" aria-pressed={resultado === id} onClick={() => setResultado(id)}>
                {nome}
              </button>
            ))}
          </div>
          <span className="campo__ajuda">{AJUDA_RESULTADO[resultado]}</span>
        </div>
        {(resultado === 'maiores' || resultado === 'menores') && (
          <div className="campo">
            <span className="rotulo">Quantos dados ficam</span>
            <Contador rotulo="quantos dados ficam" valor={quantos} min={1} max={20} aoMudar={setQuantos} />
          </div>
        )}
        {resultado === 'sucessos' && (
          <div className="campo">
            <span className="rotulo">Sucesso a partir de</span>
            <Contador rotulo="valor mínimo para sucesso" valor={alvo} min={1} max={100} aoMudar={setAlvo} />
          </div>
        )}
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
              setErro('Use o formato 2d6+3, 1d8+1d6, 4d6kh3 (3 maiores), 2d20kl1 (menor) ou 6d6>=5 (sucessos).')
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
    </>
  )
}
