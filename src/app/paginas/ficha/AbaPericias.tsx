import { ATRIBUTOS, NOME_ATRIBUTO } from '../../../regras/dnd5e/dados/atributos'
import { expressaoTeste, sinal } from '../../../rolagem/rolagem'
import { useRolador } from '../../componentes/Rolador'
import type { PropsAba } from './contexto'

export function AbaPericias({ f }: PropsAba) {
  const { rolar } = useRolador()
  return (
    <div className="aba-pericias">
      <section aria-labelledby="t-atributos">
        <h2 id="t-atributos" className="visualmente-oculto">
          Atributos
        </h2>
        <ul className="atributos">
          {ATRIBUTOS.map(({ id, abrev, nome }) => {
            const a = f.atributos[id]
            return (
              <li key={id}>
                <button
                  type="button"
                  className="atributo"
                  onClick={() => rolar(expressaoTeste(a.modificador), { rotulo: `Teste de ${nome}` })}
                  aria-label={`${nome} ${a.valor}, modificador ${sinal(a.modificador)}. Rolar teste.`}
                >
                  <span className="rotulo">{abrev}</span>
                  <span className="atributo__mod numeros">{sinal(a.modificador)}</span>
                  <span className="atributo__valor numeros">{a.valor}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="colunas">
        <section className="bloco" aria-labelledby="t-resistencias">
          <h2 id="t-resistencias">Testes de resistência</h2>
          <ul className="linhas">
            {ATRIBUTOS.map(({ id }) => {
              const r = f.resistencias[id]
              return (
                <li key={id}>
                  <button
                    type="button"
                    className="linha"
                    onClick={() => rolar(expressaoTeste(r.bonus), { rotulo: `Resistência de ${NOME_ATRIBUTO[id]}` })}
                  >
                    <span className={`marca ${r.proficiente ? 'marca--cheia' : ''}`} aria-hidden="true" />
                    <span className="linha__nome">{NOME_ATRIBUTO[id]}</span>
                    {r.proficiente && <span className="visualmente-oculto">(proficiente)</span>}
                    <span className="linha__valor numeros">{sinal(r.bonus)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="campo__ajuda">Toque para rolar. Use Vant./Desv. na barra de baixo antes, se precisar.</p>
        </section>

        <section className="bloco" aria-labelledby="t-pericias">
          <div className="bloco__cabeca">
            <h2 id="t-pericias">Perícias</h2>
            <span className="suave numeros">Percepção passiva {f.percepcaoPassiva}</span>
          </div>
          <ul className="linhas">
            {f.pericias.map((x) => (
              <li key={x.id}>
                <button type="button" className="linha" onClick={() => rolar(expressaoTeste(x.bonus), { rotulo: x.nome })}>
                  <span
                    className={`marca ${x.grau >= 1 ? 'marca--cheia' : ''} ${x.grau === 2 ? 'marca--dupla' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="linha__nome">
                    {x.nome} <span className="suave">{ATRIBUTOS.find((a) => a.id === x.atributo)!.abrev.toLowerCase()}</span>
                  </span>
                  {x.grau > 0 && (
                    <span className="visualmente-oculto">{x.grau === 2 ? '(especialização)' : '(proficiente)'}</span>
                  )}
                  <span className="linha__valor numeros">{sinal(x.bonus)}</span>
                </button>
              </li>
            ))}
            {f.ferramentasDeLadrao !== null && (
              <li>
                <button
                  type="button"
                  className="linha"
                  onClick={() => rolar(expressaoTeste(f.ferramentasDeLadrao!), { rotulo: 'Ferramentas de ladrão' })}
                >
                  <span className="marca marca--cheia" aria-hidden="true" />
                  <span className="linha__nome">
                    Ferramentas de ladrão <span className="suave">des</span>
                  </span>
                  <span className="linha__valor numeros">{sinal(f.ferramentasDeLadrao)}</span>
                </button>
              </li>
            )}
          </ul>
          <p className="campo__ajuda">
            <span className="marca marca--cheia" aria-hidden="true" /> proficiente ·{' '}
            <span className="marca marca--cheia marca--dupla" aria-hidden="true" /> especialização
          </p>
        </section>
      </div>
    </div>
  )
}
