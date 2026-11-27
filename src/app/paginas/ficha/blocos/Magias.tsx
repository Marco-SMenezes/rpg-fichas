import { useMemo, useState } from 'react'
import { NOME_ATRIBUTO } from '../../../../regras/dnd5e/dados/atributos'
import {
  alternarMagia,
  alternarPreparada,
  contagemDeMagias,
  daListaDoPersonagem,
  limitesDeMagia,
  magiasDisponiveis,
  magiasDoPersonagem,
  magiasDeTalentos,
  magiasSempre,
  segredosMagicos,
  type MagiaDeTalento,
} from '../../../../regras/dnd5e/motor/magias'
import { gastarEspaco, iniciarConcentracao, magiasTravadas, usarRecurso } from '../../../../regras/dnd5e/motor/progressao'
import type { Magia, Personagem } from '../../../../regras/dnd5e/tipos'
import { sinal } from '../../../../rolagem/rolagem'
import { Dialogo } from '../../../componentes/Dialogo'
import { Icone } from '../../../componentes/Icone'
import type { PropsBloco } from '../contexto'

/** Minúsculas e sem acentos, para a busca achar "bencao" em "Bênção". */
const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const NOME_NIVEL = (n: number) => (n === 0 ? 'Truques' : `${n}º nível`)

export function Etiquetas({ m }: { m: Magia }) {
  return (
    <span className="magia__etiquetas">
      {m.concentracao && (
        <span className="etiqueta" title="Concentração">
          C
        </span>
      )}
      {m.ritual && (
        <span className="etiqueta" title="Ritual">
          R
        </span>
      )}
    </span>
  )
}

/** Conjuração: CD, ataque, espaços e a lista de magias do personagem. */
export function BlocoConjuracao(props: PropsBloco) {
  return (
    <>
      {props.f.conjuracao && <ConjuracaoDaClasse {...props} />}
      <MagiasDeTalento {...props} />
    </>
  )
}

/** Magias de talentos: truques à vontade, magia diária (sem espaço) e rituais. */
function MagiasDeTalento({ p, f, atualizar }: PropsBloco) {
  const [aberta, setAberta] = useState<string | null>(null)
  const lista = magiasDeTalentos(p)
  if (lista.length === 0) return null
  const grupos = Array.from(new Set(lista.map((x) => x.talento)))

  const conjurar = (x: MagiaDeTalento) => {
    let novo = p
    if (x.uso === 'diaria' && x.recursoId) novo = usarRecurso(novo, x.recursoId, 1)
    if (x.magia.concentracao) novo = iniciarConcentracao(novo, x.magia.id)
    atualizar(novo)
  }

  return (
    <section className="magias-talento" aria-labelledby="t-magias-talento">
      <h3 id="t-magias-talento">Magias de talentos</h3>
      {grupos.map((nome) => {
        const doTalento = lista.filter((x) => x.talento === nome)
        const at = doTalento[0]?.atributo
        const mod = at ? f.atributos[at].modificador : 0
        return (
          <div key={nome} className="magias-talento__grupo">
            <p className="rotulo numeros">
              {nome}
              {at && ` · ${NOME_ATRIBUTO[at]} · CD ${8 + f.proficiencia + mod} · ataque ${sinal(f.proficiencia + mod)}`}
            </p>
            <ul className="magias">
              {doTalento.map((x) => {
                const chave = `talento-${x.magia.id}`
                const recurso = x.recursoId ? f.recursos.find((r) => r.id === x.recursoId) : undefined
                const esgotado = !!recurso && recurso.maximo !== null && recurso.gastos >= recurso.maximo
                return (
                  <li key={chave} className="magia">
                    <div className="magia__linha">
                      <button
                        type="button"
                        className="magia__nome"
                        aria-expanded={aberta === chave}
                        onClick={() => setAberta(aberta === chave ? null : chave)}
                      >
                        {x.magia.nome} <span className="suave">{x.magia.nivel === 0 ? 'truque' : `${x.magia.nivel}º`}</span> <Etiquetas m={x.magia} />
                        <span className="etiqueta">{x.uso === 'truque' ? 'à vontade' : x.uso === 'diaria' ? '1/descanso longo' : 'só ritual'}</span>
                      </button>
                      {(x.uso !== 'truque' || x.magia.concentracao) && (
                        <button type="button" className="botao botao--fantasma magia__conjurar" onClick={() => conjurar(x)} disabled={esgotado}>
                          {x.uso === 'ritual' ? 'Como ritual' : esgotado ? 'Usada' : 'Conjurar'}
                        </button>
                      )}
                    </div>
                    {aberta === chave && <DetalheMagia m={x.magia} />}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
      <p className="campo__ajuda">
        A magia diária volta no descanso longo (veja em Recursos de classe). Ritual leva 10 minutos a mais e não gasta espaço.
      </p>
    </section>
  )
}

function ConjuracaoDaClasse({ p, f, atualizar }: PropsBloco) {
  const [escolhendo, setEscolhendo] = useState(false)
  const [aberta, setAberta] = useState<string | null>(null)
  const c = f.conjuracao!
  const minhas = magiasDoPersonagem(p)
  const limites = limitesDeMagia(p)
  const conta = contagemDeMagias(p)
  const preparaDaLista = limites.preparadas !== null

  const conjurar = (m: Magia) => {
    // Truque não gasta espaço; só marca a concentração, se houver.
    if (m.nivel === 0) {
      if (m.concentracao) atualizar(iniciarConcentracao(p, m.id))
      return
    }
    // gasta o menor espaço disponível do nível da magia ou acima
    for (let n = m.nivel; n <= c.espacos.length; n++) {
      const livres = (c.espacos[n - 1] ?? 0) - (p.estado.espacosGastos[n - 1] ?? 0)
      if (livres > 0) {
        const gasto = gastarEspaco(p, n, 1)
        // Magia de concentração passa a ser a concentração atual (e encerra a anterior).
        return atualizar(m.concentracao ? iniciarConcentracao(gasto, m.id) : gasto)
      }
    }
  }

  return (
    <>
      <dl className="destaques numeros">
        <div>
          <dt className="rotulo">Atributo</dt>
          <dd>{NOME_ATRIBUTO[c.atributo]}</dd>
        </div>
        <div>
          <dt className="rotulo">CD</dt>
          <dd>{c.cd}</dd>
        </div>
        <div>
          <dt className="rotulo">Ataque</dt>
          <dd>{sinal(c.ataque)}</dd>
        </div>
      </dl>

      {c.espacos.length > 0 ? (
        <ul className="espacos">
          {c.espacos.map((total, i) => {
            const gastos = p.estado.espacosGastos[i] ?? 0
            if (total === 0) return null
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
      ) : (
        <p className="suave">Ainda sem espaços de magia neste nível.</p>
      )}

      <div className="contagem-magias numeros">
        {limites.truques !== null && (
          <span className={conta.truques > limites.truques ? 'excedido' : ''}>
            Truques {conta.truques}/{limites.truques}
          </span>
        )}
        {limites.conhecidas !== null && (
          <span className={conta.conhecidas > limites.conhecidas ? 'excedido' : ''}>
            Conhecidas {conta.conhecidas}/{limites.conhecidas}
          </span>
        )}
        {preparaDaLista && (
          <span className={conta.preparadas > limites.preparadas! ? 'excedido' : ''}>
            Preparadas {conta.preparadas}/{limites.preparadas}
          </span>
        )}
      </div>

      {magiasSempre(p).length > 0 && (
        <details className="magias-sempre">
          <summary className="rotulo">Sempre preparadas ({magiasSempre(p).length}), não contam no limite</summary>
          <ul className="magias">
            {magiasSempre(p).map((m) => (
              <li key={m.id} className="magia">
                <div className="magia__linha">
                  <button
                    type="button"
                    className="magia__nome"
                    aria-expanded={aberta === `sempre-${m.id}`}
                    onClick={() => setAberta(aberta === `sempre-${m.id}` ? null : `sempre-${m.id}`)}
                  >
                    {m.nome} <span className="suave">{m.nivel === 0 ? 'truque' : `${m.nivel}º`}</span> <Etiquetas m={m} />
                  </button>
                  {m.nivel > 0 && (
                    <button type="button" className="botao botao--fantasma magia__conjurar" onClick={() => conjurar(m)}>
                      Conjurar
                    </button>
                  )}
                </div>
                {aberta === `sempre-${m.id}` && <DetalheMagia m={m} />}
              </li>
            ))}
          </ul>
        </details>
      )}

      {minhas.length === 0 ? (
        <p className="suave">Nenhuma magia escolhida.</p>
      ) : (
        <ul className="magias">
          {minhas.map((m, i) => (
            <li key={m.id} className="magia">
              {(i === 0 || minhas[i - 1]!.nivel !== m.nivel) && <h3 className="rotulo magia__grupo">{NOME_NIVEL(m.nivel)}</h3>}
              <div className="magia__linha">
                {preparaDaLista && m.nivel > 0 && (
                  <input
                    type="checkbox"
                    checked={m.preparada}
                    onChange={() => atualizar(alternarPreparada(p, m.id))}
                    aria-label={`${m.nome} preparada`}
                    className="magia__preparada"
                  />
                )}
                <button
                  type="button"
                  className="magia__nome"
                  aria-expanded={aberta === m.id}
                  onClick={() => setAberta(aberta === m.id ? null : m.id)}
                >
                  {m.nome} <Etiquetas m={m} />
                </button>
                {m.nivel > 0 && (
                  <button
                    type="button"
                    className="botao botao--fantasma magia__conjurar"
                    onClick={() => conjurar(m)}
                    disabled={preparaDaLista && !m.preparada}
                  >
                    Conjurar
                  </button>
                )}
              </div>
              {aberta === m.id && <DetalheMagia m={m} />}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="botao so-edicao" onClick={() => setEscolhendo(true)}>
        <Icone nome="mais" />
        Escolher magias
      </button>
      <DialogoMagias aberto={escolhendo} aoFechar={() => setEscolhendo(false)} p={p} f={f} atualizar={atualizar} abrir={() => {}} />
    </>
  )
}

export function DetalheMagia({ m }: { m: Magia }) {
  return (
    <div className="magia__detalhe">
      <p>{m.resumo}</p>
      <dl className="definicoes definicoes--curtas">
        <dt>Tempo</dt>
        <dd>{m.tempo}</dd>
        <dt>Alcance</dt>
        <dd>{m.alcance}</dd>
        <dt>Componentes</dt>
        <dd>{m.componentes}</dd>
        <dt>Duração</dt>
        <dd>{m.duracao}</dd>
      </dl>
      <p className="suave">
        {m.escola[0]!.toUpperCase() + m.escola.slice(1)}
        {m.ritual ? ', ritual' : ''} · LdJ p. {m.pagina}
      </p>
    </div>
  )
}

function DialogoMagias({ aberto, aoFechar, p, atualizar }: PropsBloco & { aberto: boolean; aoFechar: () => void }) {
  return (
    <Dialogo aberto={aberto} titulo="Escolher magias" aoFechar={aoFechar}>
      <SeletorDeMagias p={p} aoMudar={atualizar} travadas={magiasTravadas(p.classeId, p.subclasseId, p.nivel, p.escolhasDeClasse)} />
    </Dialogo>
  )
}

/** A escolha de magias (contadores, busca, níveis e lista), sem moldura: serve no diálogo da ficha, na criação e ao subir de nível. */
export function SeletorDeMagias({
  p,
  aoMudar,
  travadas = {},
}: {
  p: Personagem
  aoMudar: (novo: Personagem) => void
  /** Magias que não podem ser desmarcadas porque uma escolha de classe as exige (id da magia → nome da opção). */
  travadas?: Record<string, string>
}) {
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState<number | 'todos'>('todos')
  const [aberta, setAberta] = useState<string | null>(null)
  const [outrasClasses, setOutrasClasses] = useState(false)
  const segredos = segredosMagicos(p)
  const disponiveis = useMemo(() => magiasDisponiveis(p, outrasClasses), [p, outrasClasses])
  const niveis = Array.from(new Set(disponiveis.map((m) => m.nivel))).sort((a, b) => a - b)
  const tem = new Set(p.magias.map((x) => x.id))
  const termo = semAcento(busca.trim())
  const lista = disponiveis.filter(
    (m) => (nivel === 'todos' || m.nivel === nivel) && (!termo || semAcento(m.nome).includes(termo) || semAcento(m.resumo).includes(termo)),
  )
  const limites = limitesDeMagia(p)
  const conta = contagemDeMagias(p)

  return (
    <>
      <p className="suave numeros magias__contagem">
        {[
          limites.truques !== null ? `Truques ${conta.truques}/${limites.truques}` : null,
          limites.conhecidas !== null ? `Conhecidas ${conta.conhecidas}/${limites.conhecidas}` : null,
          limites.preparadas !== null ? `Preparadas ${conta.preparadas}/${limites.preparadas}` : null,
          segredos > 0 ? `Segredos mágicos ${conta.segredos}/${segredos}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {segredos > 0 && (
        <label className="opcao">
          <input type="checkbox" checked={outrasClasses} onChange={(e) => setOutrasClasses(e.target.checked)} />
          <span className="opcao__texto">
            <span className="opcao__titulo">Mostrar magias de outras classes</span>
            <span className="opcao__detalhe">Segredos Mágicos (LdJ p. 54–55): {segredos} de qualquer lista, de um nível que você conjure.</span>
          </span>
        </label>
      )}
      <label className="campo">
        <span className="rotulo">Buscar</span>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Bola de fogo, cura…" autoComplete="off" spellCheck={false} />
      </label>
      <div className="segmentos segmentos--rolagem" role="group" aria-label="Nível">
        <button type="button" aria-pressed={nivel === 'todos'} onClick={() => setNivel('todos')}>
          Todos
        </button>
        {niveis.map((n) => (
          <button key={n} type="button" aria-pressed={nivel === n} onClick={() => setNivel(n)}>
            {n === 0 ? 'Truques' : `${n}º`}
          </button>
        ))}
      </div>
      {lista.length === 0 ? (
        <p className="suave">Nenhuma magia encontrada.</p>
      ) : (
        <ul className="magias">
          {lista.map((m) => (
            <li key={m.id} className="magia">
              <div className="magia__linha">
                <input
                  type="checkbox"
                  checked={tem.has(m.id)}
                  disabled={
                    (!tem.has(m.id) && !daListaDoPersonagem(p, m) && conta.segredos >= segredos) || (tem.has(m.id) && travadas[m.id] !== undefined)
                  }
                  onChange={() => aoMudar(alternarMagia(p, m.id))}
                  aria-label={`Escolher ${m.nome}`}
                  className="magia__preparada"
                />
                <button
                  type="button"
                  className="magia__nome"
                  aria-expanded={aberta === m.id}
                  onClick={() => setAberta(aberta === m.id ? null : m.id)}
                >
                  {m.nome} <span className="suave">{m.nivel === 0 ? 'truque' : `${m.nivel}º`}</span> <Etiquetas m={m} />
                  {!daListaDoPersonagem(p, m) && <span className="etiqueta etiqueta--acento">Segredo</span>}
                  {tem.has(m.id) && travadas[m.id] && <span className="etiqueta">Exigida por {travadas[m.id]}</span>}
                </button>
              </div>
              {aberta === m.id && <DetalheMagia m={m} />}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
