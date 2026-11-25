import { TALENTOS, TALENTO_POR_ID } from '../../regras/dnd5e/dados/talentos'
import type { Talento, TalentoEscolhido } from '../../regras/dnd5e/tipos'

interface Props {
  valor: TalentoEscolhido | null | undefined
  aoMudar: (t: TalentoEscolhido | null) => void
  /** Motivo para não poder pegar o talento (pré-requisito, já tem), ou null. */
  bloqueio?: (t: Talento) => string | null
  rotulo?: string
}

/** Escolha de um talento (LdJ p. 167–172) e das opções dele. */
export function SeletorTalento({ valor, aoMudar, bloqueio = () => null, rotulo = 'Talento' }: Props) {
  const t = valor ? TALENTO_POR_ID[valor.id] : undefined
  const escolhas = valor?.escolhas ?? {}
  const daSerie = (id: string) => id.replace(/\d+$/, '')

  const mudarEscolha = (id: string, v: string) => {
    const novas = { ...escolhas, [id]: v }
    // Trocar a lista de magias apaga as magias escolhidas da lista antiga.
    if (id === 'lista') for (const k of Object.keys(novas)) if (/^(truque|magia|ritual)/.test(k)) delete novas[k]
    aoMudar({ id: valor!.id, escolhas: novas })
  }

  return (
    <div className="talento">
      <label className="campo">
        <span className="rotulo">{rotulo} (LdJ p. 167–172)</span>
        <select value={valor?.id ?? ''} onChange={(e) => aoMudar(e.target.value ? { id: e.target.value, escolhas: {} } : null)}>
          <option value="">Escolha um talento…</option>
          {TALENTOS.map((x) => {
            const motivo = bloqueio(x)
            return (
              <option key={x.id} value={x.id} disabled={!!motivo && x.id !== valor?.id}>
                {x.nome}
                {x.requisito ? ` · ${x.requisito.texto}` : ''}
                {motivo ? ' (indisponível)' : ''}
              </option>
            )
          })}
        </select>
      </label>
      {t && (
        <>
          <p className="campo__ajuda">
            {t.resumo} LdJ p. {t.pagina}.{bloqueio(t) && <strong> {bloqueio(t)}</strong>}
          </p>
          {(t.escolhas ?? []).map((e) => {
            const usadas = new Set(
              Object.entries(escolhas)
                .filter(([k, v]) => k !== e.id && daSerie(k) === daSerie(e.id) && v)
                .map(([, v]) => v),
            )
            const opcoes = e.opcoes(escolhas)
            const atual = opcoes.find((o) => o.id === escolhas[e.id])
            return (
              <label key={e.id} className="campo">
                <span className="rotulo">{e.rotulo}</span>
                <select value={escolhas[e.id] ?? ''} onChange={(ev) => mudarEscolha(e.id, ev.target.value)}>
                  <option value="">Escolha…</option>
                  {opcoes.map((o) => (
                    <option key={o.id} value={o.id} disabled={usadas.has(o.id)}>
                      {o.nome}
                    </option>
                  ))}
                </select>
                {atual?.resumo && <span className="campo__ajuda">{atual.resumo}</span>}
              </label>
            )
          })}
        </>
      )}
    </div>
  )
}
