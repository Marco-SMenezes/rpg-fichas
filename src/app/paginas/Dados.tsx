import { ConteudoRolador, useRolador } from '../componentes/Rolador'
import { Topo } from '../componentes/Topo'

const MODOS = [
  ['desvantagem', 'Desvantagem'],
  ['normal', 'Normal'],
  ['vantagem', 'Vantagem'],
] as const

/** Aba Dados: o rolador completo, com o histórico grande. */
export function Dados() {
  const { rolar, modo, setModo, historico, limparHistorico } = useRolador()
  return (
    <>
      <Topo />
      <main id="conteudo" tabIndex={-1} className="pagina dados">
        <div className="lista__cabeca">
          <div>
            <h1>Dados</h1>
            <p className="suave">Rolagens livres. As da ficha também aparecem no histórico.</p>
          </div>
          <div className="segmentos" role="group" aria-label="Próxima rolagem de d20">
            {MODOS.map(([id, nome]) => (
              <button key={id} type="button" aria-pressed={modo === id} onClick={() => setModo(id)}>
                {nome}
              </button>
            ))}
          </div>
        </div>
        <div className="dados__corpo">
          <ConteudoRolador historico={historico} aoLimpar={limparHistorico} aoRolar={(e) => rolar(e, { rotulo: 'Rolagem livre' })} modo={modo} />
        </div>
      </main>
    </>
  )
}
