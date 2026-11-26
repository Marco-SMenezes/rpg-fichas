import { useState } from 'react'
import { ajustarPV, definirVidaTotal, marcarMorte, salvamentoContraMorte, situacaoDaMorte } from '../../../../regras/dnd5e/motor/progressao'
import { expressaoTeste, sinal } from '../../../../rolagem/rolagem'
import { Icone } from '../../../componentes/Icone'
import { useRolador } from '../../../componentes/Rolador'
import { formatarNumero } from '../../../util'
import type { PropsBloco } from '../contexto'

export function BlocoPV({ p, f, atualizar }: PropsBloco) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const pct = Math.max(0, Math.min(100, (p.estado.pvAtual / f.pvMaximo) * 100))
  const total = p.estado.pvAtual + p.estado.pvTemporario

  const confirmar = () => {
    const n = Number(texto)
    if (texto.trim() !== '' && Number.isFinite(n)) atualizar(definirVidaTotal(p, n))
    setEditando(false)
  }

  const vida = (
    <div className="pv">
      <div className="pv__linha">
        <button type="button" className="pv__botao" onClick={() => atualizar(ajustarPV(p, -1))} aria-label="Perder 1 PV (dano)" disabled={total === 0}>
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
      <span className="pv__ajuda">− dano · + cura; acima do máximo vira temporário. Toque no número para digitar.</span>
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

export function BlocoCA({ f }: PropsBloco) {
  return (
    <div className="valor">
      <span className="valor__numero numeros">{f.ca.valor}</span>
      <span className="valor__detalhe">{f.ca.descricao}</span>
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
