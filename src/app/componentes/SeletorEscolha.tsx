import { motivoDeBloqueio } from '../../regras/dnd5e/motor/progressao'
import type { EscolhaDeClasse, OpcaoDeEscolha } from '../../regras/dnd5e/tipos'

interface Props {
  escolha: EscolhaDeClasse
  valor: string | undefined
  aoMudar: (id: string) => void
  /** Opções que não podem ser repetidas (ex.: estilo de luta já escolhido). */
  bloqueadas?: string[]
  /** Todas as escolhas até aqui, para checar pré-requisitos (ex.: pacto do bruxo). */
  escolhas?: Record<string, string>
  /** Ids das magias que a ficha tem (ou vai ter ao confirmar), para os requisitos de magia (Lança Mística pede Rajada Mística). */
  magias?: string[]
}

/** Uma escolha de classe: lista de opções com resumo, ou um seletor quando há muitas. */
export function SeletorEscolha({ escolha, valor, aoMudar, bloqueadas = [], escolhas = {}, magias = [] }: Props) {
  const titulo = `${escolha.rotulo}${escolha.pagina ? ` (LdJ p. ${escolha.pagina})` : ''}`
  const motivo = (o: OpcaoDeEscolha) => motivoDeBloqueio(o, escolha.nivel, escolhas, magias)
  const indisponivel = (o: OpcaoDeEscolha) => bloqueadas.includes(o.id) || motivo(o) !== null
  const selecionada = escolha.opcoes.find((o) => o.id === valor)
  if (escolha.opcoes.length > 8) {
    return (
      <label className="campo">
        <span className="rotulo">{titulo}</span>
        <select value={valor ?? ''} onChange={(e) => aoMudar(e.target.value)}>
          <option value="">Escolha…</option>
          {escolha.opcoes.map((o) => (
            <option key={o.id} value={o.id} disabled={indisponivel(o)}>
              {o.nome}
              {motivo(o) ? ` (${motivo(o)})` : ''}
            </option>
          ))}
        </select>
        {selecionada && <span className="campo__ajuda">{selecionada.resumo}</span>}
      </label>
    )
  }
  return (
    <fieldset className="grupo">
      <legend className="rotulo">{titulo}</legend>
      <div className="lista-opcoes">
        {escolha.opcoes.map((o) => (
          <label key={o.id} className="opcao">
            <input
              type="radio"
              name={`escolha-${escolha.id}-${escolha.nivel}`}
              checked={valor === o.id}
              disabled={indisponivel(o)}
              onChange={() => aoMudar(o.id)}
            />
            <span className="opcao__texto">
              <span className="opcao__titulo">{o.nome}</span>
              <span className="opcao__detalhe">{o.resumo}</span>
              {motivo(o) && <span className="opcao__detalhe opcao__motivo">{motivo(o)}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Escolhas com o mesmo nome-base (estiloDeLuta e estiloDeLuta2, manobra1 e manobra2…) não podem repetir opção. */
export function opcoesJaUsadas(id: string, escolhas: Record<string, string>): string[] {
  const prefixo = id.replace(/\d+$/, '')
  return Object.entries(escolhas)
    .filter(([k, v]) => k !== id && k.replace(/\d+$/, '') === prefixo && v)
    .map(([, v]) => v)
}
