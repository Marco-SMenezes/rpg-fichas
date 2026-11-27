/**
 * Ataque com alvo no combate: escolhe o ataque e o alvo, rola contra a CA e aplica o dano.
 * Mestre: conhece as CAs e aplica o dano como nos botões de vida. Jogador: o banco confere a
 * CA secreta do monstro e recebe o dano do acerto (uma vez).
 */
import { useState } from 'react'
import { resultadoDoAtaque, type AtaqueDeCombate, type Resultado } from '../../../combate/ataques'
import { atacarMonstro, causarDano, registrarAtaqueDoMestre, type Participante } from '../../../nuvem/combate'
import { sinal, type Modo } from '../../../rolagem/rolagem'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import { useRolador } from '../../componentes/Rolador'

export interface Alvo {
  p: Participante
  /** CA conhecida (só o mestre); null: o banco confere (jogador) ou o mestre decide. */
  ca: number | null
}

interface Props {
  aberto: boolean
  aoFechar: () => void
  atacante: Participante
  ataques: AtaqueDeCombate[]
  alvos: Alvo[]
  comoMestre: boolean
  /** Só o mestre: tira a vida do alvo (monstro, jogador ou ficha dele). */
  aplicarDano?: (alvo: Participante, dano: number) => Promise<void>
}

interface Rolado {
  total: number
  d20: number | null
  resultado: Resultado | null
  /** Jogador: o acerto conferido pelo banco, para mandar o dano. */
  pendente: number | null
}

const TEXTO: Record<Resultado, string> = {
  critico: 'Acerto crítico!',
  acerto: 'Acertou!',
  erro: 'Errou.',
  'falha-critica': 'Errou (1 natural).',
}

export function DialogoAtaque({ aberto, aoFechar, atacante, ataques, alvos, comoMestre, aplicarDano }: Props) {
  const { rolar, modo: modoGlobal } = useRolador()
  const [qual, setQual] = useState(0)
  const [alvoId, setAlvoId] = useState('')
  const [modo, setModo] = useState<Modo>('normal')
  const [rolado, setRolado] = useState<Rolado | null>(null)
  const [dano, setDano] = useState<number | null>(null)
  const [estado, setEstado] = useState<'livre' | 'ocupado' | 'feito'>('livre')
  const [erro, setErro] = useState('')
  const [abertoAntes, setAbertoAntes] = useState(false)

  // Cada vez que abre é um ataque novo.
  if (aberto !== abertoAntes) {
    setAbertoAntes(aberto)
    if (aberto) {
      setRolado(null)
      setDano(null)
      setEstado('livre')
      setErro('')
      setModo(modoGlobal)
      if (!alvos.some((a) => a.p.id === alvoId)) setAlvoId(alvos[0]?.p.id ?? '')
    }
  }

  const ataque = ataques[qual] ?? ataques[0]
  const alvo = alvos.find((a) => a.p.id === alvoId) ?? alvos[0]
  if (!ataque || !alvo)
    return (
      <Dialogo aberto={aberto} titulo={`Atacar com ${atacante.nome}`} aoFechar={aoFechar}>
        <p className="suave">{!ataque ? 'Nenhum ataque com jogada de acerto nesta ficha.' : 'Ninguém para atacar.'}</p>
      </Dialogo>
    )

  const arma = ataque.nome
  const rotulo = `${atacante.nome} → ${alvo.p.nome}: ${arma}`
  const acertou = rolado?.resultado === 'acerto' || rolado?.resultado === 'critico'

  async function rolarAtaque() {
    setErro('')
    const r = rolar(`1d20${sinal(ataque!.bonus)}`, { rotulo, modo })
    if (!r) return
    if (comoMestre) {
      const resultado = resultadoDoAtaque(r.total, r.d20, alvo!.ca)
      setRolado({ total: r.total, d20: r.d20, resultado, pendente: null })
      if (resultado === 'erro' || resultado === 'falha-critica') void registrar(false, 0)
      return
    }
    setEstado('ocupado')
    try {
      const resp = await atacarMonstro(atacante.id, alvo!.p.id, arma, r.total, r.d20 ?? 0)
      const resultado: Resultado = resp.acertou ? (r.d20 === 20 ? 'critico' : 'acerto') : r.d20 === 1 ? 'falha-critica' : 'erro'
      setRolado({ total: r.total, d20: r.d20, resultado, pendente: resp.ataque })
      setEstado(resp.acertou ? 'livre' : 'feito')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível atacar.')
      setEstado('livre')
    }
  }

  async function registrar(acerto: boolean, n: number) {
    try {
      await registrarAtaqueDoMestre(atacante.id, alvo!.p.id, arma, acerto, n)
    } catch {
      // O histórico é um extra: se falhar, o ataque continua valendo.
    }
  }

  function decidir(acerto: boolean) {
    if (!rolado) return
    setRolado({ ...rolado, resultado: acerto ? 'acerto' : 'erro' })
    if (!acerto) void registrar(false, 0)
  }

  function rolarDano() {
    const r = rolar(ataque!.dano, { rotulo: `${rotulo} (dano)`, critico: rolado?.resultado === 'critico' })
    if (r) setDano(r.total)
  }

  async function aplicar() {
    const n = Math.max(0, Math.trunc(dano ?? 0))
    setEstado('ocupado')
    setErro('')
    try {
      if (comoMestre) {
        if (n > 0) await aplicarDano?.(alvo!.p, n)
        await registrar(true, n)
      } else if (rolado?.pendente) await causarDano(rolado.pendente, n)
      setEstado('feito')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível aplicar o dano.')
      setEstado('livre')
    }
  }

  return (
    <Dialogo aberto={aberto} titulo={`Atacar com ${atacante.nome}`} aoFechar={aoFechar}>
      <div className="ataque-alvo">
        <label className="campo">
          <span className="rotulo">Ataque</span>
          <select value={qual} disabled={!!rolado} onChange={(e) => setQual(Number(e.target.value))}>
            {ataques.map((a, i) => (
              <option key={i} value={i}>
                {a.nome} ({sinal(a.bonus)}
                {a.dano ? ` · ${a.dano}` : ''})
              </option>
            ))}
          </select>
        </label>
        <label className="campo">
          <span className="rotulo">Alvo</span>
          <select value={alvo.p.id} disabled={!!rolado} onChange={(e) => setAlvoId(e.target.value)}>
            {alvos.map((a) => (
              <option key={a.p.id} value={a.p.id}>
                {a.p.nome}
                {comoMestre ? (a.ca !== null ? ` (CA ${a.ca})` : ' (CA ?)') : ''}
              </option>
            ))}
          </select>
        </label>

        {!rolado ? (
          <>
            <div className="segmentos" role="group" aria-label="Vantagem">
              {(['desvantagem', 'normal', 'vantagem'] as const).map((m) => (
                <button key={m} type="button" aria-pressed={modo === m} onClick={() => setModo(m)}>
                  {m === 'normal' ? 'Normal' : m === 'vantagem' ? 'Vantagem' : 'Desvantagem'}
                </button>
              ))}
            </div>
            <button type="button" className="botao botao--primario" disabled={estado === 'ocupado'} onClick={() => void rolarAtaque()}>
              <Icone nome="d20" />
              Rolar ataque ({sinal(ataque.bonus)})
            </button>
          </>
        ) : (
          <div className="ataque-alvo__resultado" role="status">
            <p>
              <strong className="numeros">{rolado.total}</strong>
              {comoMestre && alvo.ca !== null && <span className="suave"> contra CA {alvo.ca}</span>}
              {' · '}
              {rolado.resultado ? (
                <strong className={acertou ? 'ataque-alvo__acerto' : 'ataque-alvo__erro'}>{TEXTO[rolado.resultado]}</strong>
              ) : (
                <span>A CA de {alvo.p.nome} não está no combate. Acertou?</span>
              )}
            </p>
            {!rolado.resultado && (
              <div className="acoes">
                <button type="button" className="botao" onClick={() => decidir(true)}>
                  Acertou
                </button>
                <button type="button" className="botao botao--fantasma" onClick={() => decidir(false)}>
                  Errou
                </button>
              </div>
            )}
            {acertou && estado !== 'feito' && (
              <>
                {ataque.dano && dano === null ? (
                  <button type="button" className="botao botao--primario" onClick={rolarDano}>
                    <Icone nome="d20" />
                    Rolar dano ({ataque.dano}
                    {rolado.resultado === 'critico' ? ', crítico' : ''})
                  </button>
                ) : (
                  <>
                    <label className="campo">
                      <span className="rotulo">Dano{ataque.tipo ? ` (${ataque.tipo})` : ''}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={dano ?? 0}
                        onChange={(e) => setDano(Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
                      />
                      <span className="campo__ajuda">Ajuste se o alvo tiver resistência ou vulnerabilidade.</span>
                    </label>
                    <button type="button" className="botao botao--primario" disabled={estado === 'ocupado'} onClick={() => void aplicar()}>
                      <Icone nome="espada" />
                      Aplicar {dano ?? 0} de dano em {alvo.p.nome}
                    </button>
                  </>
                )}
              </>
            )}
            {estado === 'feito' && acertou && <p className="suave">Dano aplicado.</p>}
          </div>
        )}
        {erro && (
          <p className="aviso" role="alert">
            {erro}
          </p>
        )}
        {rolado && (estado === 'feito' || !acertou) && (
          <div className="acoes">
            <button type="button" className="botao" onClick={() => (setRolado(null), setDano(null), setEstado('livre'))}>
              Outro ataque
            </button>
            <button type="button" className="botao botao--fantasma" onClick={aoFechar}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </Dialogo>
  )
}
