import { useState } from 'react'
import type { Ataque } from '../../../regras/dnd5e/motor/ficha'
import { gastarEspaco } from '../../../regras/dnd5e/motor/progressao'
import { NOME_ATRIBUTO } from '../../../regras/dnd5e/dados/atributos'
import { expressaoTeste, sinal, type Modo } from '../../../rolagem/rolagem'
import { Dialogo } from '../../componentes/Dialogo'
import { useRolador } from '../../componentes/Rolador'
import type { PropsAba } from './contexto'

export function AbaCombate({ p, f, atualizar }: PropsAba) {
  const [ataque, setAtaque] = useState<Ataque | null>(null)
  const assassino = p.subclasseId === 'assassino' && p.nivel >= 3

  return (
    <div className="aba-combate">
      <section className="bloco" aria-labelledby="t-ataques">
        <div className="bloco__cabeca">
          <h2 id="t-ataques">Ataques</h2>
          {f.ataqueFurtivo && <span className="etiqueta etiqueta--cobre numeros">Ataque Furtivo {f.ataqueFurtivo}</span>}
        </div>
        {f.ataques.length === 0 ? (
          <p className="suave">Nenhuma arma no inventário.</p>
        ) : (
          <ul className="ataques">
            {f.ataques.map((a) => (
              <li key={a.uid}>
                <button type="button" className="ataque" onClick={() => setAtaque(a)}>
                  <span className="ataque__nome">{a.nome}</span>
                  <span className="ataque__bonus numeros">{sinal(a.bonusAtaque)}</span>
                  <span className="ataque__dano numeros">
                    {a.dano} {a.tipoDano}
                  </span>
                  <span className="ataque__detalhe">
                    {a.alcance}
                    {a.propriedades.length > 0 && ` · ${a.propriedades.join(', ')}`}
                    {!a.proficiente && ' · sem proficiência'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {assassino && (
          <p className="nota">
            <strong>Assassinar.</strong> Vantagem contra quem ainda não agiu no combate; acerto em criatura surpresa é
            crítico (LdJ p. 92). As duas opções aparecem ao tocar no ataque.
          </p>
        )}
      </section>

      {f.conjuracao && (
        <section className="bloco" aria-labelledby="t-magia">
          <h2 id="t-magia">Conjuração</h2>
          <dl className="destaques numeros">
            <div>
              <dt className="rotulo">Atributo</dt>
              <dd>{NOME_ATRIBUTO[f.conjuracao.atributo]}</dd>
            </div>
            <div>
              <dt className="rotulo">CD</dt>
              <dd>{f.conjuracao.cd}</dd>
            </div>
            <div>
              <dt className="rotulo">Ataque</dt>
              <dd>{sinal(f.conjuracao.ataque)}</dd>
            </div>
          </dl>
          <ul className="espacos">
            {f.conjuracao.espacos.map((total, i) => {
              const gastos = p.estado.espacosGastos[i] ?? 0
              return (
                <li key={i}>
                  <span className="rotulo">{i + 1}º nível</span>
                  <span className="espacos__marcas">
                    {Array.from({ length: total }, (_, j) => (
                      <button
                        key={j}
                        type="button"
                        className={`espaco ${j < gastos ? 'espaco--gasto' : ''}`}
                        aria-label={`Espaço ${j + 1} de ${i + 1}º nível, ${j < gastos ? 'gasto' : 'disponível'}`}
                        onClick={() => atualizar(gastarEspaco(p, i + 1, j < gastos ? -1 : 1))}
                      />
                    ))}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <DialogoAtaque ataque={ataque} furtivo={f.ataqueFurtivo} assassino={assassino} aoFechar={() => setAtaque(null)} />
    </div>
  )
}

function DialogoAtaque({
  ataque,
  furtivo,
  assassino,
  aoFechar,
}: {
  ataque: Ataque | null
  furtivo: string | null
  assassino: boolean
  aoFechar: () => void
}) {
  const { rolar, modo: modoGlobal } = useRolador()
  const [modo, setModo] = useState<Modo>('normal')
  const [comFurtivo, setComFurtivo] = useState(false)
  const [naoAgiu, setNaoAgiu] = useState(false)
  const [surpreso, setSurpreso] = useState(false)
  const [critico, setCritico] = useState(false)
  const [duasMaos, setDuasMaos] = useState(false)
  const [aberto, setAberto] = useState<string | null>(null)

  // Zera as opções só quando abre outra arma: reabrir a mesma para rolar o dano mantém o que foi marcado.
  if (ataque && aberto !== ataque.uid) {
    setAberto(ataque.uid)
    setModo(modoGlobal)
    setComFurtivo(false)
    setNaoAgiu(false)
    setSurpreso(false)
    setCritico(false)
    setDuasMaos(false)
  }

  const modoFinal: Modo = naoAgiu && modo !== 'desvantagem' ? 'vantagem' : naoAgiu && modo === 'desvantagem' ? 'normal' : modo
  const ehCritico = critico || surpreso
  const podeFurtivo = !!furtivo && !!ataque?.furtivo

  return (
    <Dialogo aberto={!!ataque} titulo={ataque?.nome ?? ''} aoFechar={aoFechar}>
      {ataque && (
        <>
          <p className="numeros">
            Ataque <strong>{sinal(ataque.bonusAtaque)}</strong> · Dano <strong>{duasMaos && ataque.danoVersatil ? ataque.danoVersatil : ataque.dano}</strong>{' '}
            {ataque.tipoDano}
          </p>

          <div className="campo">
            <span className="rotulo">Jogada de ataque</span>
            <div className="segmentos" role="group" aria-label="Vantagem">
              {(['desvantagem', 'normal', 'vantagem'] as const).map((m) => (
                <button key={m} type="button" aria-pressed={modo === m} onClick={() => setModo(m)}>
                  {m === 'normal' ? 'Normal' : m === 'vantagem' ? 'Vantagem' : 'Desvantagem'}
                </button>
              ))}
            </div>
          </div>

          <div className="lista-opcoes">
            {assassino && (
              <>
                <label className="opcao">
                  <input type="checkbox" checked={naoAgiu} onChange={(e) => setNaoAgiu(e.target.checked)} />
                  <span className="opcao__texto">
                    <span className="opcao__titulo">Alvo ainda não agiu</span>
                    <span className="opcao__detalhe">Assassinar: vantagem no ataque.</span>
                  </span>
                </label>
                <label className="opcao">
                  <input type="checkbox" checked={surpreso} onChange={(e) => setSurpreso(e.target.checked)} />
                  <span className="opcao__texto">
                    <span className="opcao__titulo">Alvo surpreso</span>
                    <span className="opcao__detalhe">Assassinar: se acertar, é crítico.</span>
                  </span>
                </label>
              </>
            )}
            {podeFurtivo && (
              <label className="opcao">
                <input type="checkbox" checked={comFurtivo} onChange={(e) => setComFurtivo(e.target.checked)} />
                <span className="opcao__texto">
                  <span className="opcao__titulo numeros">Ataque Furtivo (+{furtivo})</span>
                  <span className="opcao__detalhe">Uma vez por turno, com vantagem ou com aliado a 1,5 m do alvo.</span>
                </span>
              </label>
            )}
            {ataque.danoVersatil && (
              <label className="opcao">
                <input type="checkbox" checked={duasMaos} onChange={(e) => setDuasMaos(e.target.checked)} />
                <span className="opcao__texto">
                  <span className="opcao__titulo">Usar com duas mãos ({ataque.danoVersatil})</span>
                </span>
              </label>
            )}
            {!surpreso && (
              <label className="opcao">
                <input type="checkbox" checked={critico} onChange={(e) => setCritico(e.target.checked)} />
                <span className="opcao__texto">
                  <span className="opcao__titulo">Acerto crítico</span>
                  <span className="opcao__detalhe">Dobra os dados de dano (LdJ p. 198).</span>
                </span>
              </label>
            )}
          </div>

          <div className="acoes acoes--duas">
            <button
              type="button"
              className="botao botao--primario"
              onClick={() => {
                rolar(expressaoTeste(ataque.bonusAtaque), { rotulo: `Ataque: ${ataque.nome}`, modo: modoFinal })
                aoFechar()
              }}
            >
              Rolar ataque
            </button>
            <button
              type="button"
              className="botao"
              onClick={() => {
                const base = duasMaos && ataque.danoVersatil ? ataque.danoVersatil : ataque.dano
                const dano = comFurtivo && podeFurtivo ? `${base}+${furtivo}` : base
                rolar(dano, {
                  rotulo: `Dano: ${ataque.nome}${comFurtivo && podeFurtivo ? ' + furtivo' : ''}`,
                  critico: ehCritico,
                })
                aoFechar()
              }}
            >
              Rolar dano{ehCritico ? ' (crítico)' : ''}
            </button>
          </div>
        </>
      )}
    </Dialogo>
  )
}
