import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ANTECEDENTES, CLASSES, RACAS } from '../../regras/dnd5e/dados'
import { NOME_ATRIBUTO, NOME_PERICIA } from '../../regras/dnd5e/dados/atributos'
import { CONDICOES, EXAUSTAO } from '../../regras/dnd5e/dados/condicoes'
import { MAGIAS } from '../../regras/dnd5e/dados/magias'
import { TALENTOS } from '../../regras/dnd5e/dados/talentos'
import { filtrarMonstros, ndComoNumero, TIPOS_DE_MONSTRO, type FiltroDeMonstros } from '../../regras/dnd5e/dados/monstros/busca'
import { carregarSRD } from '../../regras/dnd5e/dados/monstros/srd'
import type { Monstro } from '../../regras/dnd5e/dados/monstros/tipos'
import { BlocoMonstro } from '../componentes/BlocoMonstro'
import { RetratoDeMonstro } from '../componentes/IconeDeMonstro'
import { comFoto, useFotosDeMonstros } from '../../bestiario/fotos'
import { Icone } from '../componentes/Icone'
import { caminho } from '../rotas'
import { useMeusMonstros } from '../../bestiario/meus'
import type { Habilidade, Magia } from '../../regras/dnd5e/tipos'
import { Topo } from '../componentes/Topo'
import { DetalheMagia, Etiquetas } from './ficha/blocos/Magias'

const SECOES = [
  ['magias', 'Magias'],
  ['classes', 'Classes'],
  ['racas', 'Raças'],
  ['antecedentes', 'Antecedentes'],
  ['talentos', 'Talentos'],
  ['condicoes', 'Condições'],
  ['monstros', 'Monstros'],
] as const
type Secao = (typeof SECOES)[number][0]

const LISTAS = [
  ['bardo', 'Bardo'],
  ['bruxo', 'Bruxo'],
  ['clerigo', 'Clérigo'],
  ['druida', 'Druida'],
  ['feiticeiro', 'Feiticeiro'],
  ['mago', 'Mago'],
  ['paladino', 'Paladino'],
  ['patrulheiro', 'Patrulheiro'],
] as const

/** Minúsculas e sem acentos, para a busca achar "bencao" em "Bênção". */
const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const casa = (termo: string, ...textos: (string | undefined)[]) => !termo || textos.some((t) => t && semAcento(t).includes(termo))

const pag = (p: number | null | undefined) => (p ? ` (LdJ p. ${p})` : '')

function Item({ titulo, detalhe, children }: { titulo: ReactNode; detalhe?: ReactNode; children: ReactNode }) {
  return (
    <details className="compendio__item">
      <summary>
        <span className="compendio__titulo">{titulo}</span>
        {detalhe && <span className="suave">{detalhe}</span>}
      </summary>
      <div className="compendio__corpo">{children}</div>
    </details>
  )
}

function ListaHabilidades({ itens, nivel = false }: { itens: (Habilidade & { nivel?: number })[]; nivel?: boolean }) {
  return (
    <ul className="habilidades-curtas">
      {itens.map((h) => (
        <li key={h.id}>
          <strong>
            {nivel && h.nivel ? `${h.nivel}º · ` : ''}
            {h.nome}.
          </strong>{' '}
          {h.resumo} <span className="suave">{pag(h.pagina)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Aba Compêndio: consulta das regras do Tomo sem abrir uma ficha. */
export function Compendio() {
  const [secao, setSecao] = useState<Secao>('magias')
  const [busca, setBusca] = useState('')
  const [lista, setLista] = useState('')
  const [nivel, setNivel] = useState<number | ''>('')
  const [tipo, setTipo] = useState('')
  const [ndMin, setNdMin] = useState('')
  const [ndMax, setNdMax] = useState('')
  const [ordem, setOrdem] = useState<OrdemDeMonstros>('nome')
  const termo = semAcento(busca.trim())

  return (
    <>
      <Topo />
      <main id="conteudo" tabIndex={-1} className="pagina compendio">
        <div className="lista__cabeca">
          <div>
            <h1>Compêndio</h1>
            <p className="suave">Resumos em palavras próprias, com a página do Livro do Jogador para o texto completo.</p>
          </div>
        </div>

        <div className="segmentos segmentos--cheio" role="group" aria-label="O que consultar">
          {SECOES.map(([id, nome]) => (
            <button key={id} type="button" aria-pressed={secao === id} onClick={() => setSecao(id)}>
              {nome}
            </button>
          ))}
        </div>

        <div className={`compendio__filtros${secao === 'monstros' ? ' compendio__filtros--monstros' : ''}`}>
          <label className="campo">
            <span className="rotulo">Buscar</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome ou palavra do resumo…"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          {secao === 'magias' && (
            <>
              <label className="campo">
                <span className="rotulo">Lista</span>
                <select value={lista} onChange={(e) => setLista(e.target.value)}>
                  <option value="">Todas as classes</option>
                  {LISTAS.map(([id, nome]) => (
                    <option key={id} value={id}>
                      {nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span className="rotulo">Nível</span>
                <select value={nivel} onChange={(e) => setNivel(e.target.value === '' ? '' : Number(e.target.value))}>
                  <option value="">Todos</option>
                  {Array.from({ length: 10 }, (_, n) => (
                    <option key={n} value={n}>
                      {n === 0 ? 'Truques' : `${n}º nível`}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {secao === 'monstros' && (
            <>
              <SeletorOrdem valor={ordem} aoMudar={setOrdem} />
              <label className="campo">
                <span className="rotulo">Tipo</span>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="">Todos</option>
                  {TIPOS_DE_MONSTRO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <div className="compendio__nd">
                <label className="campo">
                  <span className="rotulo">ND de</span>
                  <select value={ndMin} onChange={(e) => setNdMin(e.target.value)}>
                    <option value="">—</option>
                    {NDS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  <span className="rotulo">até</span>
                  <select value={ndMax} onChange={(e) => setNdMax(e.target.value)}>
                    <option value="">—</option>
                    {NDS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
        </div>

        {secao === 'magias' && <Magias termo={termo} lista={lista} nivel={nivel} />}
        {secao === 'classes' && <Classes termo={termo} />}
        {secao === 'racas' && <Racas termo={termo} />}
        {secao === 'antecedentes' && <Antecedentes termo={termo} />}
        {secao === 'talentos' && <Talentos termo={termo} />}
        {secao === 'condicoes' && <Condicoes termo={termo} />}
        {secao === 'monstros' && (
          <Monstros
            busca={busca}
            tipo={tipo}
            ndMin={ndMin === '' ? null : ndComoNumero(ndMin)}
            ndMax={ndMax === '' ? null : ndComoNumero(ndMax)}
            ordem={ordem}
          />
        )}
      </main>
    </>
  )
}

function Contagem({ n, total, nome }: { n: number; total: number; nome: string }) {
  return (
    <p className="suave numeros" aria-live="polite">
      {n === total ? `${total} ${nome}` : `${n} de ${total} ${nome}`}
    </p>
  )
}

function Magias({ termo, lista, nivel }: { termo: string; lista: string; nivel: number | '' }) {
  const achadas = useMemo(
    () =>
      MAGIAS.filter(
        (m: Magia) => (!lista || m.classes.includes(lista)) && (nivel === '' || m.nivel === nivel) && casa(termo, m.nome, m.resumo, m.escola),
      ),
    [termo, lista, nivel],
  )
  return (
    <>
      <Contagem n={achadas.length} total={MAGIAS.length} nome="magias" />
      <div className="compendio__lista">
        {achadas.map((m) => (
          <Item
            key={m.id}
            titulo={
              <>
                {m.nome} <Etiquetas m={m} />
              </>
            }
            detalhe={`${m.nivel === 0 ? 'truque' : `${m.nivel}º nível`} · ${m.escola}`}
          >
            <DetalheMagia m={m} />
          </Item>
        ))}
      </div>
    </>
  )
}

function Classes({ termo }: { termo: string }) {
  const achadas = CLASSES.filter((c) =>
    casa(
      termo,
      c.nome,
      ...c.habilidades.flatMap((h) => [h.nome, h.resumo]),
      ...c.subclasses.flatMap((s) => [s.nome, s.resumo, ...s.habilidades.map((h) => h.nome)]),
    ),
  )
  return (
    <>
      <Contagem n={achadas.length} total={CLASSES.length} nome="classes" />
      <div className="compendio__lista">
        {achadas.map((c) => (
          <Item
            key={c.id}
            titulo={c.nome}
            detalhe={`d${c.dadoDeVida} · resistências ${c.resistencias.map((a) => NOME_ATRIBUTO[a]).join(' e ')}${pag(c.pagina)}`}
          >
            <ListaHabilidades itens={c.habilidades} nivel />
            <h3>{c.nomeSubclasse}</h3>
            {c.subclasses.map((s) => (
              <Item key={s.id} titulo={s.nome} detalhe={`${s.resumo}${pag(s.pagina)}`}>
                <ListaHabilidades itens={s.habilidades} nivel />
              </Item>
            ))}
          </Item>
        ))}
      </div>
    </>
  )
}

const textoAumentos = (a: Partial<Record<string, number>>) =>
  Object.entries(a)
    .filter(([, v]) => v)
    .map(([k, v]) => `${NOME_ATRIBUTO[k as keyof typeof NOME_ATRIBUTO]} +${v}`)
    .join(', ')

function Racas({ termo }: { termo: string }) {
  const achadas = RACAS.filter((r) =>
    casa(termo, r.nome, ...r.tracos.flatMap((t) => [t.nome, t.resumo]), ...r.subracas.flatMap((s) => [s.nome, ...s.tracos.map((t) => t.nome)])),
  )
  return (
    <>
      <Contagem n={achadas.length} total={RACAS.length} nome="raças" />
      <div className="compendio__lista">
        {achadas.map((r) => (
          <Item
            key={r.id}
            titulo={r.nome}
            detalhe={`${textoAumentos(r.aumentos) || 'atributos à escolha'} · ${String(r.deslocamento).replace('.', ',')} m · ${r.tamanho.toLowerCase()}${pag(r.pagina)}`}
          >
            <ListaHabilidades itens={r.tracos} />
            <p className="suave">
              Idiomas: {r.idiomas.join(', ')}
              {r.idiomasExtras ? ' e mais um à escolha' : ''}.
            </p>
            {r.subracas.map((s) => (
              <Item key={s.id} titulo={s.nome} detalhe={`${textoAumentos(s.aumentos)}${pag(s.pagina)}`}>
                <ListaHabilidades itens={s.tracos} />
              </Item>
            ))}
          </Item>
        ))}
      </div>
    </>
  )
}

function Antecedentes({ termo }: { termo: string }) {
  const achados = ANTECEDENTES.filter((a) =>
    casa(termo, a.nome, a.caracteristica.nome, a.caracteristica.resumo, ...a.pericias.map((p) => NOME_PERICIA[p])),
  )
  return (
    <>
      <Contagem n={achados.length} total={ANTECEDENTES.length} nome="antecedentes" />
      <div className="compendio__lista">
        {achados.map((a) => (
          <Item key={a.id} titulo={a.nome} detalhe={`${a.pericias.map((p) => NOME_PERICIA[p]).join(', ')}${pag(a.pagina)}`}>
            <dl className="definicoes definicoes--curtas">
              <dt>Perícias</dt>
              <dd>{a.pericias.map((p) => NOME_PERICIA[p]).join(', ')}</dd>
              <dt>Ferramentas</dt>
              <dd>{[...a.ferramentas, ...(a.escolhaFerramenta ? [a.escolhaFerramenta.rotulo] : [])].join(', ') || '—'}</dd>
              <dt>Idiomas</dt>
              <dd>{a.idiomasExtras ? `${a.idiomasExtras} à escolha` : '—'}</dd>
              <dt>Dinheiro</dt>
              <dd className="numeros">{a.moedasPo} po</dd>
            </dl>
            <ListaHabilidades itens={[a.caracteristica]} />
          </Item>
        ))}
      </div>
    </>
  )
}

function Talentos({ termo }: { termo: string }) {
  const achados = TALENTOS.filter((t) => casa(termo, t.nome, t.resumo, t.requisito?.texto))
  return (
    <>
      <Contagem n={achados.length} total={TALENTOS.length} nome="talentos" />
      <p className="campo__ajuda">Regra opcional (LdJ p. 167): troca um incremento de atributo por um talento.</p>
      <div className="compendio__lista">
        {achados.map((t) => (
          <Item key={t.id} titulo={t.nome} detalhe={`${t.requisito ? `requer ${t.requisito.texto.toLowerCase()} · ` : ''}LdJ p. ${t.pagina}`}>
            <p>{t.resumo}</p>
          </Item>
        ))}
      </div>
    </>
  )
}

function Condicoes({ termo }: { termo: string }) {
  const achadas = CONDICOES.filter((c) => casa(termo, c.nome, c.resumo))
  return (
    <>
      <div className="compendio__lista">
        {achadas.map((c) => (
          <Item key={c.id} titulo={c.nome} detalhe={`LdJ p. ${c.pagina}`}>
            <p>{c.resumo}</p>
          </Item>
        ))}
        {casa(termo, 'exaustão', ...EXAUSTAO) && (
          <Item titulo="Exaustão" detalhe="LdJ p. 292">
            <ol className="compendio__exaustao">
              {EXAUSTAO.slice(1).map((e, i) => (
                <li key={i}>
                  <strong className="numeros">{i + 1}.</strong> {e}
                </li>
              ))}
            </ol>
            <p className="suave">Os efeitos se acumulam. Um descanso longo tira um nível.</p>
          </Item>
        )}
      </div>
    </>
  )
}

const NDS = ['0', '1/8', '1/4', '1/2', ...Array.from({ length: 30 }, (_, i) => String(i + 1))]

export const CREDITO_SRD = 'Monstros do SRD 5.1 (Wizards of the Coast), licença CC BY 4.0, traduzidos pelo Tomo.'

/** Os monstros vêm de outro pedaço do site, baixado só quando a aba abre. */
export function useMonstrosSRD(): { lista: Monstro[] | null; erro: string } {
  const [lista, setLista] = useState<Monstro[] | null>(null)
  const [erro, setErro] = useState('')
  useEffect(() => {
    let vivo = true
    carregarSRD()
      .then((l) => vivo && setLista(l))
      .catch(() => vivo && setErro('Não foi possível carregar os monstros. Verifique a internet e tente de novo.'))
    return () => {
      vivo = false
    }
  }, [])
  return { lista, erro }
}

function ItemMonstro({ m }: { m: Monstro }) {
  const [aberto, setAberto] = useState(false)
  return (
    <details className="compendio__item" onToggle={(e) => setAberto(e.currentTarget.open)}>
      <summary>
        <RetratoDeMonstro foto={m.foto} tipo={m.tipo} nome={m.nome} tamanho={32} />
        <span className="compendio__titulo">
          {m.nome} {m.origem === 'meu' && <span className="etiqueta">Meu</span>}
        </span>
        <span className="suave">
          ND {m.nd} · {m.tipo}
        </span>
      </summary>
      {aberto && (
        <div className="compendio__corpo">
          <BlocoMonstro m={m} />
        </div>
      )}
    </details>
  )
}

function Monstros({
  busca,
  tipo,
  ndMin,
  ndMax,
  ordem,
}: {
  busca: string
  tipo: string
  ndMin: number | null
  ndMax: number | null
  ordem: OrdemDeMonstros
}) {
  const { lista: srd, erro } = useMonstrosSRD()
  const meus = useMeusMonstros()
  const fotos = useFotosDeMonstros()
  const lista = useMemo(() => (srd ? [...meus, ...srd.map((m) => comFoto(m, fotos))] : null), [srd, meus, fotos])
  const achados = useMemo(
    () => (lista ? filtrarMonstros(lista, { termo: busca, tipo, ndMin, ndMax, ordem }) : []),
    [lista, busca, tipo, ndMin, ndMax, ordem],
  )
  if (erro) return <p className="aviso">{erro}</p>
  if (!lista) return <p className="suave">Carregando monstros…</p>
  return (
    <>
      <div className="compendio__meus">
        <Contagem n={achados.length} total={lista.length} nome="monstros" />
        <a className="botao" href={caminho.bestiario()}>
          <Icone nome="grade" />
          Meus monstros{meus.length ? ` (${meus.length})` : ''}
        </a>
      </div>
      <div className="compendio__lista">
        {achados.map((m) => (
          <ItemMonstro key={m.id} m={m} />
        ))}
      </div>
      <p className="suave compendio__credito">{CREDITO_SRD}</p>
    </>
  )
}

export type OrdemDeMonstros = NonNullable<FiltroDeMonstros['ordem']>

export function SeletorOrdem({ valor, aoMudar }: { valor: OrdemDeMonstros; aoMudar: (o: OrdemDeMonstros) => void }) {
  return (
    <label className="campo">
      <span className="rotulo">Ordenar por</span>
      <select value={valor} onChange={(e) => aoMudar(e.target.value as OrdemDeMonstros)}>
        <option value="nome">Nome</option>
        <option value="nd">ND (menor primeiro)</option>
        <option value="nd-desc">ND (maior primeiro)</option>
      </select>
    </label>
  )
}
