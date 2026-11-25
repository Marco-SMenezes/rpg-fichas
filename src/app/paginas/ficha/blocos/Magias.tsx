import { useMemo, useState } from 'react'
import { NOME_ATRIBUTO } from '../../../../regras/dnd5e/dados/atributos'
import {
  alternarMagia,
  alternarPreparada,
  contagemDeMagias,
  limitesDeMagia,
  magiasDisponiveis,
  magiasDoPersonagem,
  magiasSempre,
} from '../../../../regras/dnd5e/motor/magias'
import { gastarEspaco } from '../../../../regras/dnd5e/motor/progressao'
import type { Magia } from '../../../../regras/dnd5e/tipos'
import { sinal } from '../../../../rolagem/rolagem'
import { Dialogo } from '../../../componentes/Dialogo'
import { Icone } from '../../../componentes/Icone'
import type { PropsBloco } from '../contexto'

/** Minúsculas e sem acentos, para a busca achar "bencao" em "Bênção". */
const semAcento = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const NOME_NIVEL = (n: number) => (n === 0 ? 'Truques' : `${n}º nível`)

function Etiquetas({ m }: { m: Magia }) {
  return (
    <span className="magia__etiquetas">
      {m.concentracao && <span className="etiqueta" title="Concentração">C</span>}
      {m.ritual && <span className="etiqueta" title="Ritual">R</span>}
    </span>
  )
}

/** Conjuração: CD, ataque, espaços e a lista de magias do personagem. */
export function BlocoConjuracao({ p, f, atualizar }: PropsBloco) {
  const [escolhendo, setEscolhendo] = useState(false)
  const [aberta, setAberta] = useState<string | null>(null)
  if (!f.conjuracao) return null
  const c = f.conjuracao
  const minhas = magiasDoPersonagem(p)
  const limites = limitesDeMagia(p)
  const conta = contagemDeMagias(p)
  const preparaDaLista = limites.preparadas !== null

  const conjurar = (m: Magia) => {
    // gasta o menor espaço disponível do nível da magia ou acima
    for (let n = m.nivel; n <= c.espacos.length; n++) {
      const livres = (c.espacos[n - 1] ?? 0) - (p.estado.espacosGastos[n - 1] ?? 0)
      if (livres > 0) return atualizar(gastarEspaco(p, n, 1))
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
                  <button type="button" className="magia__nome" aria-expanded={aberta === `sempre-${m.id}`} onClick={() => setAberta(aberta === `sempre-${m.id}` ? null : `sempre-${m.id}`)}>
                    {m.nome} <span className="suave">{m.nivel}º</span> <Etiquetas m={m} />
                  </button>
                  <button type="button" className="botao botao--fantasma magia__conjurar" onClick={() => conjurar(m)}>
                    Conjurar
                  </button>
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
                <button type="button" className="magia__nome" aria-expanded={aberta === m.id} onClick={() => setAberta(aberta === m.id ? null : m.id)}>
                  {m.nome} <Etiquetas m={m} />
                </button>
                {m.nivel > 0 && (
                  <button type="button" className="botao botao--fantasma magia__conjurar" onClick={() => conjurar(m)} disabled={preparaDaLista && !m.preparada}>
                    Conjurar
                  </button>
                )}
              </div>
              {aberta === m.id && <DetalheMagia m={m} />}
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="botao" onClick={() => setEscolhendo(true)}>
        <Icone nome="mais" />
        Escolher magias
      </button>
      <DialogoMagias aberto={escolhendo} aoFechar={() => setEscolhendo(false)} p={p} f={f} atualizar={atualizar} abrir={() => {}} />
    </>
  )
}

function DetalheMagia({ m }: { m: Magia }) {
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
  const [busca, setBusca] = useState('')
  const [nivel, setNivel] = useState<number | 'todos'>('todos')
  const [aberta, setAberta] = useState<string | null>(null)
  const disponiveis = useMemo(() => magiasDisponiveis(p), [p])
  const niveis = Array.from(new Set(disponiveis.map((m) => m.nivel))).sort((a, b) => a - b)
  const tem = new Set(p.magias.map((x) => x.id))
  const termo = semAcento(busca.trim())
  const lista = disponiveis.filter(
    (m) => (nivel === 'todos' || m.nivel === nivel) && (!termo || semAcento(m.nome).includes(termo) || semAcento(m.resumo).includes(termo)),
  )
  const limites = limitesDeMagia(p)
  const conta = contagemDeMagias(p)

  return (
    <Dialogo aberto={aberto} titulo="Escolher magias" aoFechar={aoFechar}>
      <p className="suave numeros">
        {[
          limites.truques !== null ? `Truques ${conta.truques}/${limites.truques}` : null,
          limites.conhecidas !== null ? `Conhecidas ${conta.conhecidas}/${limites.conhecidas}` : null,
          limites.preparadas !== null ? `Preparadas ${conta.preparadas}/${limites.preparadas}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
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
                <input type="checkbox" checked={tem.has(m.id)} onChange={() => atualizar(alternarMagia(p, m.id))} aria-label={`Escolher ${m.nome}`} className="magia__preparada" />
                <button type="button" className="magia__nome" aria-expanded={aberta === m.id} onClick={() => setAberta(aberta === m.id ? null : m.id)}>
                  {m.nome} <span className="suave">{m.nivel === 0 ? 'truque' : `${m.nivel}º`}</span> <Etiquetas m={m} />
                </button>
              </div>
              {aberta === m.id && <DetalheMagia m={m} />}
            </li>
          ))}
        </ul>
      )}
    </Dialogo>
  )
}
