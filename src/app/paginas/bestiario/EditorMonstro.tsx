import { useEffect, useState, type ReactNode } from 'react'
import { meusMonstros, useMeusMonstros } from '../../../bestiario/meus'
import { ATRIBUTOS } from '../../../regras/dnd5e/dados/atributos'
import { TIPOS_DE_MONSTRO, xpDoNd } from '../../../regras/dnd5e/dados/monstros/busca'
import type { Monstro, TextoDeMonstro } from '../../../regras/dnd5e/dados/monstros/tipos'
import { BlocoMonstro } from '../../componentes/BlocoMonstro'
import { CampoRetrato } from '../../componentes/CampoRetrato'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import { Topo } from '../../componentes/Topo'
import { caminho, irPara } from '../../rotas'

const TAMANHOS = ['Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso']
const NDS = ['0', '1/8', '1/4', '1/2', ...Array.from({ length: 30 }, (_, i) => String(i + 1))]

const LISTAS: [keyof Pick<Monstro, 'tracos' | 'acoes' | 'acoesBonus' | 'reacoes' | 'lendarias'>, string][] = [
  ['tracos', 'Traços'],
  ['acoes', 'Ações'],
  ['acoesBonus', 'Ações bônus'],
  ['reacoes', 'Reações'],
  ['lendarias', 'Ações lendárias'],
]

export function EditorMonstro({ id }: { id: string }) {
  const meus = useMeusMonstros()
  const m = meus.find((x) => x.id === id)

  useEffect(() => {
    document.title = m ? `${m.nome} · Tomo` : 'Tomo'
    return () => {
      document.title = 'Tomo'
    }
  }, [m])

  if (!m)
    return (
      <>
        <Topo voltarPara={caminho.bestiario()} titulo="Monstro" />
        <main id="conteudo" tabIndex={-1} className="pagina vazio">
          <h1>Monstro não encontrado</h1>
          <p className="suave">Ele pode ter sido excluído.</p>
          <a className="botao" href={caminho.bestiario()}>
            Ver o bestiário
          </a>
        </main>
      </>
    )
  return <Editor key={m.id} m={m} />
}

function Editor({ m }: { m: Monstro }) {
  const [excluindo, setExcluindo] = useState(false)
  const mudar = (parte: Partial<Monstro>) => meusMonstros.salvar({ ...m, ...parte })
  const texto = (k: keyof Monstro, rotulo: string, dica = '') => (
    <label className="campo">
      <span className="rotulo">{rotulo}</span>
      <input value={String(m[k] ?? '')} placeholder={dica} onChange={(e) => mudar({ [k]: e.target.value } as Partial<Monstro>)} />
    </label>
  )
  const numero = (k: 'ca' | 'pv', rotulo: string) => (
    <label className="campo">
      <span className="rotulo">{rotulo}</span>
      <input type="number" inputMode="numeric" value={m[k]} onChange={(e) => mudar({ [k]: Math.max(0, Number(e.target.value) || 0) })} />
    </label>
  )

  return (
    <>
      <Topo
        voltarPara={caminho.bestiario()}
        titulo={m.nome}
        acoes={
          <button
            type="button"
            className="botao botao--fantasma botao--icone"
            onClick={() => setExcluindo(true)}
            aria-label="Excluir monstro"
            title="Excluir"
          >
            <Icone nome="lixo" />
          </button>
        }
      />
      <main id="conteudo" tabIndex={-1} className="pagina editor-monstro">
        <div className="editor-monstro__form">
          <section className="bloco">
            <h2>Identidade</h2>
            <CampoRetrato valor={m.foto} nome={m.nome} aoMudar={(foto) => (foto ? mudar({ foto }) : mudar({ foto: undefined }))} />
            {texto('nome', 'Nome')}
            <div className="editor-monstro__grade">
              <label className="campo">
                <span className="rotulo">Tamanho</span>
                <select value={m.tamanho} onChange={(e) => mudar({ tamanho: e.target.value })}>
                  {TAMANHOS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span className="rotulo">Tipo</span>
                <select value={m.tipo} onChange={(e) => mudar({ tipo: e.target.value })}>
                  {!TIPOS_DE_MONSTRO.includes(m.tipo) && <option value={m.tipo}>{m.tipo || '—'}</option>}
                  {TIPOS_DE_MONSTRO.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              {texto('subtipo', 'Subtipo', 'goblinoide, demônio…')}
              {texto('tendencia', 'Tendência', 'neutro e mau…')}
            </div>
          </section>

          <section className="bloco">
            <h2>Defesa e movimento</h2>
            <div className="editor-monstro__grade">
              {numero('ca', 'Classe de Armadura')}
              {texto('caDescricao', 'Origem da CA', 'armadura natural…')}
              {numero('pv', 'Pontos de vida (média)')}
              {texto('dadosDeVida', 'Dados de vida', '2d6')}
            </div>
            {texto('deslocamento', 'Deslocamento', '9 m, voo 18 m')}
          </section>

          <section className="bloco">
            <h2>Atributos</h2>
            <div className="editor-monstro__atributos">
              {ATRIBUTOS.map((a) => (
                <label key={a.id} className="campo">
                  <span className="rotulo">{a.abrev}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={m.atributos[a.id]}
                    onChange={(e) => mudar({ atributos: { ...m.atributos, [a.id]: Math.max(1, Math.min(30, Number(e.target.value) || 1)) } })}
                  />
                </label>
              ))}
            </div>
            <p className="rotulo">Testes de resistência (deixe em branco se não tiver)</p>
            <div className="editor-monstro__atributos">
              {ATRIBUTOS.map((a) => (
                <label key={a.id} className="campo">
                  <span className="rotulo">{a.abrev}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={m.salvaguardas[a.id] ?? ''}
                    onChange={(e) => {
                      const s = { ...m.salvaguardas }
                      if (e.target.value === '') delete s[a.id]
                      else s[a.id] = Number(e.target.value) || 0
                      mudar({ salvaguardas: s })
                    }}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="bloco">
            <h2>Detalhes</h2>
            <ListaPericias m={m} mudar={mudar} />
            {texto('vulnerabilidades', 'Vulnerabilidades')}
            {texto('resistencias', 'Resistências')}
            {texto('imunidades', 'Imunidades a dano')}
            {texto('imunidadesACondicao', 'Imunidades a condições')}
            {texto('sentidos', 'Sentidos', 'visão no escuro 18 m, Percepção passiva 10')}
            {texto('idiomas', 'Idiomas')}
            <label className="campo">
              <span className="rotulo">Nível de desafio</span>
              <select value={m.nd} onChange={(e) => mudar({ nd: e.target.value, xp: xpDoNd(e.target.value) })}>
                {NDS.map((n) => (
                  <option key={n} value={n}>
                    {n} ({xpDoNd(n).toLocaleString('pt-BR')} XP)
                  </option>
                ))}
              </select>
            </label>
          </section>

          {LISTAS.map(([k, titulo]) => (
            <ListaDeTextos key={k} titulo={titulo} itens={m[k]} aoMudar={(itens) => mudar({ [k]: itens } as Partial<Monstro>)}>
              {k === 'lendarias' && (
                <label className="campo">
                  <span className="rotulo">Texto antes das ações lendárias</span>
                  <textarea rows={3} value={m.descricaoLendaria} onChange={(e) => mudar({ descricaoLendaria: e.target.value })} />
                </label>
              )}
            </ListaDeTextos>
          ))}
        </div>

        <aside className="editor-monstro__previa" aria-label="Prévia">
          <h2>{m.nome}</h2>
          <BlocoMonstro m={m} />
        </aside>
      </main>

      <Dialogo
        aberto={excluindo}
        titulo="Excluir monstro"
        aoFechar={() => setExcluindo(false)}
        rodape={
          <>
            <button type="button" className="botao" onClick={() => setExcluindo(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao--perigo"
              onClick={() => {
                meusMonstros.excluir(m.id)
                irPara(caminho.bestiario(), true)
              }}
            >
              <Icone nome="lixo" />
              Excluir
            </button>
          </>
        }
      >
        <p>
          <strong>{m.nome}</strong> será apagado da sua conta e deste aparelho.
        </p>
      </Dialogo>
    </>
  )
}

function ListaPericias({ m, mudar }: { m: Monstro; mudar: (p: Partial<Monstro>) => void }) {
  const trocar = (i: number, p: Partial<Monstro['pericias'][number]>) => mudar({ pericias: m.pericias.map((x, j) => (j === i ? { ...x, ...p } : x)) })
  return (
    <fieldset className="editor-monstro__lista">
      <legend className="rotulo">Perícias</legend>
      {m.pericias.map((p, i) => (
        <div key={i} className="editor-monstro__pericia">
          <input value={p.nome} onChange={(e) => trocar(i, { nome: e.target.value })} aria-label={`Perícia ${i + 1}`} placeholder="Percepção" />
          <input
            type="number"
            inputMode="numeric"
            value={p.bonus}
            onChange={(e) => trocar(i, { bonus: Number(e.target.value) || 0 })}
            aria-label={`Bônus de ${p.nome || 'perícia'}`}
          />
          <button
            type="button"
            className="botao botao--fantasma botao--icone"
            onClick={() => mudar({ pericias: m.pericias.filter((_, j) => j !== i) })}
            aria-label={`Remover ${p.nome || 'perícia'}`}
          >
            <Icone nome="lixo" />
          </button>
        </div>
      ))}
      <div>
        <button type="button" className="botao" onClick={() => mudar({ pericias: [...m.pericias, { nome: '', bonus: 0 }] })}>
          <Icone nome="mais" />
          Perícia
        </button>
      </div>
    </fieldset>
  )
}

function ListaDeTextos({
  titulo,
  itens,
  aoMudar,
  children,
}: {
  titulo: string
  itens: TextoDeMonstro[]
  aoMudar: (l: TextoDeMonstro[]) => void
  children?: ReactNode
}) {
  const trocar = (i: number, p: Partial<TextoDeMonstro>) => aoMudar(itens.map((x, j) => (j === i ? { ...x, ...p } : x)))
  return (
    <section className="bloco">
      <h2>{titulo}</h2>
      {children}
      {itens.map((t, i) => (
        <div key={i} className="editor-monstro__texto">
          <div className="editor-monstro__pericia">
            <input value={t.nome} onChange={(e) => trocar(i, { nome: e.target.value })} aria-label={`${titulo}: nome ${i + 1}`} placeholder="Nome" />
            <button
              type="button"
              className="botao botao--fantasma botao--icone"
              onClick={() => aoMudar(itens.filter((_, j) => j !== i))}
              aria-label={`Remover ${t.nome || titulo}`}
            >
              <Icone nome="lixo" />
            </button>
          </div>
          <textarea
            rows={3}
            value={t.texto}
            onChange={(e) => trocar(i, { texto: e.target.value })}
            aria-label={`${titulo}: texto de ${t.nome || i + 1}`}
            placeholder="Ataque Corpo a Corpo com Arma: +4 para acertar, alcance 1,5 m, um alvo. Acerto: 5 (1d6 + 2) de dano cortante."
          />
        </div>
      ))}
      <div>
        <button type="button" className="botao" onClick={() => aoMudar([...itens, { nome: '', texto: '' }])}>
          <Icone nome="mais" />
          Adicionar
        </button>
      </div>
    </section>
  )
}
