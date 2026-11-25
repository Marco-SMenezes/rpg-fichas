import { useId } from 'react'

const OPCOES = ['Feminino', 'Masculino', 'Não binário']

/** Gênero do personagem: opções comuns ou texto livre em "Outro". */
export function SeletorGenero({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  const id = useId()
  const outro = valor !== '' && !OPCOES.includes(valor)
  const selecionado = outro ? 'outro' : valor
  return (
    <div className="campo">
      <label className="rotulo" htmlFor={id}>
        Gênero
      </label>
      <select
        id={id}
        value={selecionado}
        onChange={(e) => {
          const v = e.target.value
          aoMudar(v === 'outro' ? ' ' : v)
        }}
      >
        <option value="">Não informar</option>
        {OPCOES.map((o) => (
          <option key={o}>{o}</option>
        ))}
        <option value="outro">Outro…</option>
      </select>
      {outro && (
        <input
          aria-label="Gênero (outro)"
          value={valor.trim()}
          onChange={(e) => aoMudar(e.target.value || ' ')}
          placeholder="Como o personagem se identifica…"
          autoComplete="off"
          autoFocus
        />
      )}
    </div>
  )
}
