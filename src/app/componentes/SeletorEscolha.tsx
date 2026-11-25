import type { EscolhaDeClasse } from '../../regras/dnd5e/tipos'

interface Props {
  escolha: EscolhaDeClasse
  valor: string | undefined
  aoMudar: (id: string) => void
  /** Opções que não podem ser repetidas (ex.: estilo de luta já escolhido). */
  bloqueadas?: string[]
}

/** Uma escolha de classe: lista de opções com resumo, ou um seletor quando há muitas. */
export function SeletorEscolha({ escolha, valor, aoMudar, bloqueadas = [] }: Props) {
  const titulo = `${escolha.rotulo}${escolha.pagina ? ` (LdJ p. ${escolha.pagina})` : ''}`
  const indisponivel = (o: EscolhaDeClasse['opcoes'][number]) => bloqueadas.includes(o.id) || (o.nivelMinimo ?? 0) > escolha.nivel
  if (escolha.opcoes.length > 8) {
    return (
      <label className="campo">
        <span className="rotulo">{titulo}</span>
        <select value={valor ?? ''} onChange={(e) => aoMudar(e.target.value)}>
          <option value="">Escolha…</option>
          {escolha.opcoes.map((o) => (
            <option key={o.id} value={o.id} disabled={indisponivel(o)}>
              {o.nome}
            </option>
          ))}
        </select>
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
