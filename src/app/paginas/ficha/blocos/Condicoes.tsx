import { CONDICOES, CONDICAO_POR_ID, EXAUSTAO } from '../../../../regras/dnd5e/dados/condicoes'
import { MAGIA_POR_ID } from '../../../../regras/dnd5e/dados/magias'
import { alternarCondicao, definirExaustao, encerrarConcentracao } from '../../../../regras/dnd5e/motor/progressao'
import { Contador } from '../../../componentes/Contador'
import type { PropsBloco } from '../contexto'

/** Concentração, exaustão e condições (LdJ p. 205, 291–293). */
export function BlocoCondicoes({ p, atualizar }: PropsBloco) {
  const ativas = p.estado.condicoes ?? []
  const exaustao = p.estado.exaustao ?? 0
  const concentracao = p.estado.concentracao
  const nomeConcentracao = concentracao ? (MAGIA_POR_ID[concentracao]?.nome ?? concentracao) : null

  return (
    <div className="condicoes">
      <div className="condicoes__linha">
        <span className="rotulo">Concentração</span>
        {nomeConcentracao ? (
          <div className="condicoes__concentracao">
            <strong>{nomeConcentracao}</strong>
            <button type="button" className="botao botao--fantasma" onClick={() => atualizar(encerrarConcentracao(p))}>
              Encerrar
            </button>
          </div>
        ) : (
          <span className="suave">Nenhuma. Ao conjurar uma magia de concentração, ela aparece aqui.</span>
        )}
      </div>

      <div className="condicoes__linha">
        <span className="rotulo">Exaustão (LdJ p. 292)</span>
        <div className="condicoes__exaustao">
          <Contador rotulo="nível de exaustão" valor={exaustao} min={0} max={6} aoMudar={(v) => atualizar(definirExaustao(p, v))} />
          <span className={exaustao ? '' : 'suave'}>{exaustao ? EXAUSTAO.slice(1, exaustao + 1).join(' ') : EXAUSTAO[0]}</span>
        </div>
      </div>

      <div className="condicoes__linha">
        <span className="rotulo">Condições (LdJ p. 291)</span>
        <div className="condicoes__lista" role="group" aria-label="Condições">
          {CONDICOES.map((c) => (
            <button
              key={c.id}
              type="button"
              className="condicao"
              aria-pressed={ativas.includes(c.id)}
              onClick={() => atualizar(alternarCondicao(p, c.id))}
            >
              {c.nome}
            </button>
          ))}
        </div>
      </div>

      {ativas.length > 0 && (
        <ul className="condicoes__ativas">
          {ativas.map((id) => {
            const c = CONDICAO_POR_ID[id]
            return c ? (
              <li key={id}>
                <strong>{c.nome}.</strong> {c.resumo} <span className="suave">(LdJ p. {c.pagina})</span>
              </li>
            ) : null
          })}
        </ul>
      )}
    </div>
  )
}
