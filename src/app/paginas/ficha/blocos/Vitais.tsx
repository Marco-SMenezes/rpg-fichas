import { useState } from 'react'
import { MAGIA_POR_ID } from '../../../../regras/dnd5e/dados/magias'
import { ajustarPV, curar, definirVidaTotal, encerrarConcentracao, marcarMorte, salvamentoContraMorte, situacaoDaMorte } from '../../../../regras/dnd5e/motor/progressao'
import { expressaoTeste, sinal } from '../../../../rolagem/rolagem'
import { Icone } from '../../../componentes/Icone'
import { useRolador } from '../../../componentes/Rolador'
import { formatarNumero } from '../../../util'
import type { PropsBloco } from '../contexto'

export function BlocoPV({ p, f, atualizar }: PropsBloco) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  // Dano somado desde o último teste de concentração (vários toques no − contam juntos).
  const [danoConc, setDanoConc] = useState(0)
  const [resultadoConc, setResultadoConc] = useState('')
  const { rolar } = useRolador()

  const sofrer = (dano: number) => {
    if (dano <= 0) return
    if (p.estado.concentracao) {
      setDanoConc((d) => d + dano)
      setResultadoConc('')
    }
  }
  const pct = Math.max(0, Math.min(100, (p.estado.pvAtual / f.pvMaximo) * 100))
  const total = p.estado.pvAtual + p.estado.pvTemporario

  const confirmar = () => {
    const n = Number(texto)
    if (texto.trim() !== '' && Number.isFinite(n)) {
      sofrer(total - Math.max(0, Math.floor(n)))
      atualizar(definirVidaTotal(p, n))
    }
    setEditando(false)
  }

  const vida = (
    <div className="pv">
      <div className="pv__linha">
        <button
          type="button"
          className="pv__botao"
          onClick={() => {
            sofrer(1)
            atualizar(ajustarPV(p, -1))
          }}
          aria-label="Perder 1 PV (dano)"
          disabled={total === 0}
        >
          <Icone nome="menos" tamanho={24} />
        </button>
        {editando ? (
          <input
            className="pv__entrada numeros"
            type="number"
            inputMode="numeric"
            min={0}
            autoFocus
            value={texto}
            aria-label="Vida nova"
            onChange={(e) => setTexto(e.target.value)}
            onBlur={confirmar}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmar()
              if (e.key === 'Escape') setEditando(false)
            }}
          />
        ) : (
          <button
            type="button"
            className="pv__valor numeros"
            onClick={() => {
              setTexto(String(total))
              setEditando(true)
            }}
            aria-label={`Vida ${p.estado.pvAtual} de ${f.pvMaximo}${p.estado.pvTemporario ? ` mais ${p.estado.pvTemporario} temporários` : ''}. Tocar para digitar.`}
          >
            <strong>{p.estado.pvAtual}</strong>
            <span className="suave">/{f.pvMaximo}</span>
            {p.estado.pvTemporario > 0 && <span className="valor__temp">+{p.estado.pvTemporario} temp.</span>}
          </button>
        )}
        <button type="button" className="pv__botao" onClick={() => atualizar(ajustarPV(p, 1))} aria-label="Ganhar 1 PV (cura ou temporário)">
          <Icone nome="mais" tamanho={24} />
        </button>
      </div>
      <span className="medidor" aria-hidden="true">
        <span style={{ inlineSize: `${pct}%` }} className={pct <= 25 ? 'medidor--perigo' : pct <= 50 ? 'medidor--alerta' : ''} />
      </span>
      {p.estado.concentracao && danoConc > 0 && (
        <TesteDeConcentracao
          magia={MAGIA_POR_ID[p.estado.concentracao]?.nome ?? p.estado.concentracao}
          cd={Math.max(10, Math.floor(danoConc / 2))}
          aoRolar={() => {
            const cd = Math.max(10, Math.floor(danoConc / 2))
            const r = rolar(expressaoTeste(f.resistencias.con.bonus), { rotulo: `Concentração (CD ${cd})` })
            if (!r) return
            if (r.total < cd) {
              atualizar(encerrarConcentracao(p))
              setResultadoConc(`Tirou ${r.total}: perdeu a concentração.`)
            } else setResultadoConc(`Tirou ${r.total}: manteve a concentração.`)
            setDanoConc(0)
          }}
          aoIgnorar={() => setDanoConc(0)}
        />
      )}
      {resultadoConc && <p className="pv__conc-resultado" role="status">{resultadoConc}</p>}
      <div className="pv__rodape">
        <span className="pv__ajuda">− dano · + cura; acima do máximo vira temporário. Toque no número para digitar.</span>
        {p.estado.pvAtual < f.pvMaximo && (
          <button type="button" className="botao pv__encher" onClick={() => atualizar(curar(p, f.pvMaximo))}>
            Encher vida
          </button>
        )}
      </div>
    </div>
  )
  if (situacaoDaMorte(p) === 'consciente') return vida
  return (
    <div className="pv-zerado">
      {vida}
      <TestesContraMorte p={p} atualizar={atualizar} />
    </div>
  )
}

/** Concentrado e levou dano: teste de Constituição com CD 10 ou metade do dano (LdJ p. 205). */
function TesteDeConcentracao({ magia, cd, aoRolar, aoIgnorar }: { magia: string; cd: number; aoRolar: () => void; aoIgnorar: () => void }) {
  return (
    <div className="nota pv__conc">
      <p>
        Concentrando em <strong>{magia}</strong>: teste de Constituição, <strong className="numeros">CD {cd}</strong> (10 ou
        metade do dano, o que for maior; LdJ p. 205).
      </p>
      <div className="acoes">
        <button type="button" className="botao botao--primario" onClick={aoRolar}>
          Rolar teste
        </button>
        <button type="button" className="botao botao--fantasma" onClick={aoIgnorar}>
          Agora não
        </button>
      </div>
    </div>
  )
}

/** Com 0 PV: três sucessos estabilizam, três falhas matam (LdJ p. 199). */
function TestesContraMorte({ p, atualizar }: Pick<PropsBloco, 'p' | 'atualizar'>) {
  const { rolar } = useRolador()
  const situacao = situacaoDaMorte(p)
  const { sucessos, falhas } = p.estado.morte
  const rolarTeste = () => {
    const r = rolar('1d20', { rotulo: 'Teste contra a morte', modo: 'normal' })
    if (r?.d20) atualizar(salvamentoContraMorte(p, r.d20))
  }
  const marcas = (tipo: 'sucessos' | 'falhas', atual: number) => (
    <div className={`morte__linha morte__linha--${tipo}`}>
      <span className="rotulo">{tipo === 'sucessos' ? 'Sucessos' : 'Falhas'}</span>
      <div className="morte__marcas">
        {[1, 2, 3].map((i) => (
          <button
            key={i}
            type="button"
            className="morte__marca"
            aria-pressed={atual >= i}
            aria-label={`${tipo === 'sucessos' ? 'Sucessos' : 'Falhas'}: ${i}`}
            onClick={() => atualizar(marcarMorte(p, tipo, atual >= i ? i - 1 : i))}
          />
        ))}
      </div>
    </div>
  )
  return (
    <section className="morte" aria-label="Testes contra a morte">
      <p className={`morte__situacao morte__situacao--${situacao}`}>
        {situacao === 'morto'
          ? 'Morto. Só magia traz de volta.'
          : situacao === 'estavel'
            ? 'Estável: inconsciente, mas sem rolar mais testes. Volta com 1 PV em 1d4 horas.'
            : 'Caído com 0 PV: role um teste contra a morte no começo de cada turno.'}
      </p>
      {marcas('sucessos', sucessos)}
      {marcas('falhas', falhas)}
      {situacao === 'morrendo' && (
        <button type="button" className="botao botao--primario" onClick={rolarTeste}>
          Rolar teste contra a morte
        </button>
      )}
      <p className="campo__ajuda">10 ou mais é sucesso; 1 natural conta duas falhas; 20 natural volta com 1 PV (LdJ p. 199).</p>
    </section>
  )
}

export function BlocoCA({ p, f, atualizar }: PropsBloco) {
  return (
    <div className="valor">
      <span className="valor__numero numeros">{f.ca.valor}</span>
      <span className="valor__detalhe">{f.ca.descricao}</span>
      {f.ambidestro && (
        <label className="alternar ca__duas-armas">
          <input
            type="checkbox"
            checked={!!p.estado.duasArmas}
            onChange={(e) => atualizar({ ...p, estado: { ...p.estado, duasArmas: e.target.checked } })}
          />
          Uma arma em cada mão (+1)
        </label>
      )}
    </div>
  )
}

export function BlocoIniciativa({ f }: PropsBloco) {
  const { rolar } = useRolador()
  return (
    <button type="button" className="valor" onClick={() => rolar(expressaoTeste(f.iniciativa), { rotulo: 'Iniciativa' })}>
      <span className="valor__numero numeros">{sinal(f.iniciativa)}</span>
      <span className="valor__detalhe">tocar para rolar</span>
    </button>
  )
}

export function BlocoDeslocamento({ f }: PropsBloco) {
  return (
    <div className="valor">
      <span className="valor__numero numeros">{formatarNumero(f.deslocamento)}</span>
      <span className="valor__detalhe">metros</span>
    </div>
  )
}

export function BlocoProficiencia({ p, f }: PropsBloco) {
  return (
    <div className="valor">
      <span className="valor__numero numeros">{sinal(f.proficiencia)}</span>
      <span className="valor__detalhe">nível {p.nivel}</span>
    </div>
  )
}

export function BlocoDadosDeVida({ f, abrir }: PropsBloco) {
  return (
    <button type="button" className="valor" onClick={() => abrir('descanso')}>
      <span className="valor__numero numeros">
        {f.dadosDeVidaRestantes}
        <span className="suave">/{f.dadosDeVidaTotal}</span>
      </span>
      <span className="valor__detalhe">d{f.dadoDeVida} · descansar</span>
    </button>
  )
}

export function BlocoInspiracao({ p, atualizar }: PropsBloco) {
  const tem = p.estado.inspiracao
  return (
    <button
      type="button"
      className={`valor valor--inspiracao ${tem ? 'ativa' : ''}`}
      aria-pressed={tem}
      onClick={() => atualizar({ ...p, estado: { ...p.estado, inspiracao: !tem } })}
    >
      <Icone nome="estrela" tamanho={28} preenchido={tem} />
      <span className="valor__detalhe">{tem ? 'tem' : 'não tem'}</span>
    </button>
  )
}
