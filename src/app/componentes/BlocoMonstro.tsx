/** Bloco de estatísticas de um monstro, no formato do Livro dos Monstros. */
import type { ReactNode } from 'react'
import { ATRIBUTOS } from '../../regras/dnd5e/dados/atributos'
import type { Monstro, TextoDeMonstro } from '../../regras/dnd5e/dados/monstros/tipos'

type Trecho = { texto: string } | { mostrar: string; expressao: string; rotulo: string }

const ROLAVEL = /([+-]\d+) para acertar|\((\d+d\d+)(?: ([+-]) (\d+))?\)/g

/** Separa o texto em pedaços comuns e pedaços que viram botão de rolar (acerto e dano). */
export function trechosRolaveis(texto: string, nome: string): Trecho[] {
  const r: Trecho[] = []
  let ultimo = 0
  for (const m of texto.matchAll(ROLAVEL)) {
    const i = m.index
    if (m[1]) {
      if (i > ultimo) r.push({ texto: texto.slice(ultimo, i) })
      r.push({ mostrar: m[1], expressao: `1d20${m[1]}`, rotulo: nome })
      r.push({ texto: ' para acertar' })
    } else {
      if (i + 1 > ultimo) r.push({ texto: texto.slice(ultimo, i + 1) })
      r.push({
        mostrar: m[0].slice(1, -1),
        expressao: `${m[2]}${m[3] ? `${m[3]}${m[4]}` : ''}`,
        rotulo: `${nome} (dano)`,
      })
      r.push({ texto: ')' })
    }
    ultimo = i + m[0].length
  }
  if (ultimo < texto.length) r.push({ texto: texto.slice(ultimo) })
  return r
}

type Rolar = (expressao: string, rotulo: string) => void

/** **negrito** e _itálico_, com os trechos rolaveis dentro do texto comum. */
function Linha({ texto, nome, aoRolar }: { texto: string; nome: string; aoRolar: Rolar | undefined }) {
  const partes = texto.split(/(\*\*[^*]+\*\*|_[^_]+_)/g)
  return (
    <>
      {partes.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
        if (p.length > 2 && p.startsWith('_') && p.endsWith('_')) return <em key={i}>{p.slice(1, -1)}</em>
        if (!aoRolar) return p
        return trechosRolaveis(p, nome).map((t, j) =>
          'texto' in t ? (
            t.texto
          ) : (
            <button
              key={`${i}-${j}`}
              type="button"
              className="bloco-monstro__rolar numeros"
              data-rolar={t.expressao}
              onClick={() => aoRolar(t.expressao, t.rotulo)}
              title={`Rolar ${t.expressao}`}
            >
              {t.mostrar}
            </button>
          ),
        )
      })}
    </>
  )
}

function Texto({ t, aoRolar }: { t: TextoDeMonstro; aoRolar: Rolar | undefined }) {
  const linhas = t.texto.split('\n').filter((l) => l.trim())
  return (
    <div className="bloco-monstro__texto">
      {linhas.map((l, i) => (
        <p key={i} className={l.startsWith('* ') ? 'bloco-monstro__item' : undefined}>
          {i === 0 && t.nome && <strong className="bloco-monstro__nome-texto">{t.nome}. </strong>}
          <Linha texto={l.replace(/^\* /, '')} nome={t.nome} aoRolar={aoRolar} />
        </p>
      ))}
    </div>
  )
}

const sinal = (n: number) => (n >= 0 ? `+${n}` : String(n))
const mod = (v: number) => Math.floor((v - 10) / 2)

function Linhas({ itens }: { itens: [string, ReactNode][] }) {
  const visiveis = itens.filter(([, v]) => v !== '' && v !== null && v !== undefined)
  if (!visiveis.length) return null
  return (
    <dl className="bloco-monstro__linhas">
      {visiveis.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Secao({ titulo, itens, intro, aoRolar }: { titulo: string; itens: TextoDeMonstro[]; intro?: string; aoRolar: Rolar | undefined }) {
  if (!itens.length) return null
  return (
    <section className="bloco-monstro__secao">
      <h4>{titulo}</h4>
      {intro && <p>{intro}</p>}
      {itens.map((t, i) => (
        <Texto key={i} t={t} aoRolar={aoRolar} />
      ))}
    </section>
  )
}

export function BlocoMonstro({ m, aoRolar }: { m: Monstro; aoRolar?: Rolar }) {
  const tipo = [m.tamanho, m.tipo.toLowerCase()].filter(Boolean).join(' ') + (m.subtipo ? ` (${m.subtipo})` : '')
  const salvaguardas = ATRIBUTOS.filter((a) => m.salvaguardas[a.id] !== undefined)
    .map((a) => `${a.nome.slice(0, 3)} ${sinal(m.salvaguardas[a.id]!)}`)
    .join(', ')
  return (
    <article className="bloco-monstro">
      <header className="bloco-monstro__cabeca">
        <p className="suave">
          {tipo}
          {m.tendencia && `, ${m.tendencia}`}
        </p>
      </header>
      <Linhas
        itens={[
          ['Classe de Armadura', `${m.ca}${m.caDescricao ? ` (${m.caDescricao})` : ''}`],
          ['Pontos de Vida', `${m.pv}${m.dadosDeVida ? ` (${m.dadosDeVida})` : ''}`],
          ['Deslocamento', m.deslocamento],
        ]}
      />
      <table className="bloco-monstro__atributos numeros">
        <thead>
          <tr>
            {ATRIBUTOS.map((a) => (
              <th key={a.id} scope="col">
                {a.abrev}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {ATRIBUTOS.map((a) => (
              <td key={a.id}>
                {m.atributos[a.id]} ({sinal(mod(m.atributos[a.id]))})
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <Linhas
        itens={[
          ['Testes de resistência', salvaguardas],
          ['Perícias', m.pericias.map((p) => `${p.nome} ${sinal(p.bonus)}`).join(', ')],
          ['Vulnerabilidades', m.vulnerabilidades],
          ['Resistências', m.resistencias],
          ['Imunidades', m.imunidades],
          ['Imune a condições', m.imunidadesACondicao],
          ['Sentidos', m.sentidos],
          ['Idiomas', m.idiomas || '—'],
        ]}
      />
      <p className="bloco-monstro__nd">{`Nível de desafio ${m.nd} (${m.xp.toLocaleString('pt-BR')} XP)`}</p>
      {m.tracos.length > 0 && (
        <section className="bloco-monstro__secao">
          {m.tracos.map((t, i) => (
            <Texto key={i} t={t} aoRolar={aoRolar} />
          ))}
        </section>
      )}
      <Secao titulo="Ações" itens={m.acoes} aoRolar={aoRolar} />
      <Secao titulo="Ações Bônus" itens={m.acoesBonus} aoRolar={aoRolar} />
      <Secao titulo="Reações" itens={m.reacoes} aoRolar={aoRolar} />
      <Secao titulo="Ações Lendárias" itens={m.lendarias} intro={m.descricaoLendaria} aoRolar={aoRolar} />
    </article>
  )
}
