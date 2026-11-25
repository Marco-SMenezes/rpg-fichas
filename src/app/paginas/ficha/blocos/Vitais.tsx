import { expressaoTeste, sinal } from '../../../../rolagem/rolagem'
import { Icone } from '../../../componentes/Icone'
import { useRolador } from '../../../componentes/Rolador'
import { formatarNumero } from '../../../util'
import type { PropsBloco } from '../contexto'

export function BlocoPV({ p, f, abrir }: PropsBloco) {
  const pct = Math.max(0, Math.min(100, (p.estado.pvAtual / f.pvMaximo) * 100))
  return (
    <button type="button" className="valor valor--pv" onClick={() => abrir('vida')}>
      <span className="valor__pv numeros">
        <strong>{p.estado.pvAtual}</strong>
        <span className="suave">/{f.pvMaximo}</span>
        {p.estado.pvTemporario > 0 && <span className="valor__temp">+{p.estado.pvTemporario} temp.</span>}
      </span>
      <span className="medidor" aria-hidden="true">
        <span style={{ inlineSize: `${pct}%` }} className={pct <= 25 ? 'medidor--perigo' : pct <= 50 ? 'medidor--alerta' : ''} />
      </span>
      <span className="valor__acao">Dano, cura ou temporários</span>
    </button>
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
