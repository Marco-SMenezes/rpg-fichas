import { usarRecurso } from '../../../../regras/dnd5e/motor/progressao'
import { Contador } from '../../../componentes/Contador'
import type { PropsBloco } from '../contexto'

/** Recursos de classe (com quanto sobra) e valores de classe. */
export function BlocoClasse({ p, f, atualizar }: PropsBloco) {
  const linhas = [
    ...(f.ataquesPorAcao > 1 ? [{ nome: 'Ataques por ação', valor: String(f.ataquesPorAcao) }] : []),
    ...(f.margemCritico < 20 ? [{ nome: 'Crítico', valor: `${f.margemCritico}–20` }] : []),
    ...f.extras,
  ]
  if (f.recursos.length === 0 && linhas.length === 0) return <p className="suave">Nada a controlar neste nível.</p>
  return (
    <>
      {f.recursos.length > 0 && (
        <ul className="recursos">
          {f.recursos.map((r) => {
            const restantes = r.maximo === null ? null : r.maximo - r.gastos
            return (
              <li key={r.id} className="recurso">
                <div className="recurso__texto">
                  <span className="recurso__nome">{r.nome}</span>
                  <span className="suave">
                    {r.detalhe} · volta no descanso {r.recarga}
                  </span>
                </div>
                {restantes === null ? (
                  <span className="recurso__ilimitado">ilimitado</span>
                ) : (
                  <div className="recurso__contador">
                    <Contador
                      rotulo={`${r.nome} restantes`}
                      valor={restantes}
                      min={0}
                      max={r.maximo!}
                      aoMudar={(v) => atualizar(usarRecurso(p, r.id, v < restantes ? 1 : -1))}
                    />
                    <span className="suave numeros">de {r.maximo}</span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {linhas.length > 0 && (
        <dl className="definicoes">
          {linhas.map((l) => (
            <div key={l.nome} className="definicoes__linha">
              <dt>{l.nome}</dt>
              <dd className="numeros">{l.valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  )
}
