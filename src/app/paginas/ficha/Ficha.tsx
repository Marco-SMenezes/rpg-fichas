import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { calcularFicha } from '../../../regras/dnd5e/motor/ficha'
import type { Personagem } from '../../../regras/dnd5e/tipos'
import { Icone } from '../../componentes/Icone'
import { CampoRetrato, Retrato } from '../../componentes/CampoRetrato'
import { Dialogo } from '../../componentes/Dialogo'
import { opcoesJaUsadas, SeletorEscolha } from '../../componentes/SeletorEscolha'
import { escolhasPendentes } from '../../../regras/dnd5e/motor/progressao'
import { Topo } from '../../componentes/Topo'
import { personagens, usePersonagens } from '../../estado'
import { caminho } from '../../rotas'
import { resumoPersonagem } from '../../util'
import { blocosDisponiveis, SECOES, type Bloco } from './blocos'
import { ABA_PERSONALIZADA, alternarOculto, definirTodosOcultos, type Layout } from '../../../layout/layout'
import type { DialogoFicha } from './contexto'
import { DialogoDescanso, DialogoNivel } from './Dialogos'
import { Painel } from './Painel'
import { useLayout, useTela } from './useLayout'

export function Ficha({ id }: { id: string }) {
  const lista = usePersonagens()
  const p = lista.find((x) => x.id === id)

  useEffect(() => {
    document.title = p ? `${p.nome} · Tomo` : 'Tomo'
    return () => {
      document.title = 'Tomo'
    }
  }, [p])

  if (!p) {
    return (
      <>
        <Topo voltarPara={caminho.lista()} titulo="Ficha" />
        <main id="conteudo" tabIndex={-1} className="pagina vazio">
          <h1>Ficha não encontrada</h1>
          <p className="suave">Ela pode ter sido excluída ou estar salva em outro aparelho.</p>
          <a className="botao" href={caminho.lista()}>
            Ver personagens
          </a>
        </main>
      </>
    )
  }
  return <FichaPersonagem key={p.id} p={p} />
}

interface PropsFicha {
  p: Personagem
  /** Ficha de outra pessoa (mestre vendo a mesa): sem editar, descansar ou subir de nível. */
  somenteLeitura?: boolean
  voltarPara?: string
  acoesExtras?: ReactNode
}

export function FichaPersonagem({ p, somenteLeitura = false, voltarPara = caminho.lista(), acoesExtras }: PropsFicha) {
  const f = calcularFicha(p)
  const [dialogo, setDialogo] = useState<DialogoFicha | null>(null)
  const [editando, setEditando] = useState(false)
  // Modo de jogo: esconde o que é montar a ficha e deixa o que se usa na mesa (lembrado no aparelho).
  const [jogando, setJogando] = useState(lerModoDeJogo)
  const alternarJogo = () => {
    const novo = !jogando
    setJogando(novo)
    if (novo) setEditando(false)
    try {
      localStorage.setItem(CHAVE_MODO_JOGO, novo ? '1' : '0')
    } catch {
      // Sem armazenamento: vale só nesta visita.
    }
  }
  // A aba Personalizada é a que abre primeiro.
  const [aba, setAba] = useState<string>(ABA_PERSONALIZADA)
  const [escolhendo, setEscolhendo] = useState(false)
  const tela = useTela()
  const conjurador = f.conjuracao !== null
  // Recalcula a lista só quando muda o que define quais blocos existem.
  const blocos = useMemo(() => blocosDisponiveis(f), [conjurador, f.magiasDeTalento > 0])
  const atualizar = (novo: Personagem) => (somenteLeitura ? novo : personagens.salvar(novo))
  const fechar = () => setDialogo(null)
  const props = { p, f, atualizar, abrir: setDialogo }
  const { layout, definir, restaurar, personalizado, minha, definirMinha, restaurarMinha, minhaAlterada } = useLayout(
    p,
    atualizar,
    blocos,
    tela,
    somenteLeitura,
  )
  // Abas com algum bloco à vista. Organizando, aparecem todas, para dar para levar blocos a uma aba vazia.
  const abas = [
    { id: ABA_PERSONALIZADA, titulo: 'Personalizada' },
    ...SECOES.filter((x) => editando || layout.some((i) => i.secao === x.id && !i.oculto)),
  ]
  const abaAtual = abas.some((x) => x.id === aba) ? aba : ABA_PERSONALIZADA
  const naMinha = abaAtual === ABA_PERSONALIZADA
  const painel = {
    ...props,
    blocos,
    tela,
    layout: naMinha ? minha : layout,
    secao: abaAtual,
    aoMudarLayout: naMinha ? definirMinha : definir,
    abaPersonalizada: naMinha,
  }

  return (
    <>
      <Topo
        voltarPara={voltarPara}
        titulo={p.nome}
        acoes={
          somenteLeitura ? (
            acoesExtras
          ) : (
            <>
              <button type="button" className="botao botao--fantasma" onClick={() => setDialogo('descanso')} aria-label="Descansar">
                <Icone nome="fogueira" />
                Descansar
              </button>
              {!jogando && (
                <button type="button" className="botao" onClick={() => setDialogo('nivel')} disabled={p.nivel >= 20} aria-label="Subir de nível">
                  <Icone nome="seta_cima" />
                  <span className="so-largo">Subir de nível</span>
                  <span className="so-estreito" aria-hidden="true">
                    Nível
                  </span>
                </button>
              )}
            </>
          )
        }
      />
      <main id="conteudo" tabIndex={-1} className={`pagina ficha${jogando ? ' ficha--jogo' : ''}`}>
        <header className="ficha__cabeca">
          <BotaoRetrato p={p} somenteLeitura={somenteLeitura || jogando} aoMudar={(retrato) => atualizar({ ...p, retrato })} />
          <div className="ficha__titulo">
            <p className="rotulo">{resumoPersonagem(p)}</p>
            <h1>{p.nome}</h1>
            {p.conceito && <p className="suave">{p.conceito}</p>}
          </div>
          {somenteLeitura && <p className="etiqueta">Só leitura</p>}
          {!somenteLeitura && (
            <div className="ficha__modos">
              <button type="button" className="botao" aria-pressed={jogando} onClick={alternarJogo}>
                <Icone nome="d20" />
                {jogando ? 'Sair do modo de jogo' : 'Modo de jogo'}
              </button>
              {!editando && !jogando && (
                <button type="button" className="botao" onClick={() => setEditando(true)}>
                  <Icone nome="grade" />
                  Organizar
                </button>
              )}
            </div>
          )}
        </header>

        {editando && (
          <div className="barra-organizar" role="region" aria-label="Organizando a ficha">
            <p>
              <strong>Organizando.</strong> Arraste pela alça <Icone nome="alca" tamanho={16} /> ou toque em <Icone nome="ajustes" tamanho={16} />{' '}
              para mudar largura, posição ou esconder. {tela === 'larga' ? 'Este layout vale para telas largas.' : 'Este layout vale para o celular.'}
            </p>
            <div className="acoes">
              {(naMinha ? minhaAlterada : personalizado) && (
                <button type="button" className="botao botao--fantasma" onClick={naMinha ? restaurarMinha : restaurar}>
                  Restaurar padrão
                </button>
              )}
              <button type="button" className="botao botao--primario" onClick={() => setEditando(false)}>
                Pronto
              </button>
            </div>
          </div>
        )}

        {f.avisos.map((a) => (
          <p key={a} className="aviso">
            {a}
          </p>
        ))}

        {!somenteLeitura && !jogando && <EscolhasPendentes p={p} atualizar={atualizar} />}

        <nav className="abas-ficha" aria-label="Seções da ficha">
          {abas.map((x) => (
            <button
              key={x.id}
              type="button"
              className="abas-ficha__aba"
              aria-current={x.id === abaAtual ? 'page' : undefined}
              onClick={() => setAba(x.id)}
            >
              {x.titulo}
            </button>
          ))}
        </nav>

        {naMinha && !somenteLeitura && !jogando && (
          <div className="aba-personalizada__acoes">
            <button type="button" className="botao" onClick={() => setEscolhendo(true)}>
              <Icone nome="olho" />
              Escolher o que aparece
            </button>
          </div>
        )}

        {somenteLeitura ? (
          // fieldset desativado: todos os campos e botões da ficha ficam só para ver.
          <fieldset disabled className="somente-leitura">
            <legend className="visualmente-oculto">Ficha só para leitura</legend>
            <Painel {...painel} editando={false} />
          </fieldset>
        ) : (
          <Painel {...painel} editando={editando} />
        )}

        <DialogoVisibilidade aberto={escolhendo} aoFechar={() => setEscolhendo(false)} blocos={blocos} layout={minha} aoMudar={definirMinha} />
      </main>

      <DialogoDescanso aberto={dialogo === 'descanso'} aoFechar={fechar} p={p} f={f} atualizar={atualizar} />
      <DialogoNivel aberto={dialogo === 'nivel'} aoFechar={fechar} p={p} f={f} atualizar={atualizar} />
    </>
  )
}

const CHAVE_MODO_JOGO = 'tomo:modo-jogo'
function lerModoDeJogo(): boolean {
  try {
    return localStorage.getItem(CHAVE_MODO_JOGO) === '1'
  } catch {
    return false
  }
}

/** Escolhas que ficaram vazias (fichas antigas): dá para completar aqui mesmo. */
function EscolhasPendentes({ p, atualizar }: { p: Personagem; atualizar: (p: Personagem) => void }) {
  const pendentes = escolhasPendentes(p)
  if (pendentes.length === 0) return null
  return (
    <section className="nota pendentes" aria-labelledby="t-pendentes">
      <h2 id="t-pendentes">Faltam escolhas</h2>
      <p>Estas escolhas entraram no Tomo depois que a ficha foi criada. Complete quando puder.</p>
      {pendentes.map((e) => (
        <SeletorEscolha
          key={e.id}
          escolha={e}
          valor={undefined}
          bloqueadas={opcoesJaUsadas(e.id, p.escolhasDeClasse)}
          escolhas={p.escolhasDeClasse}
          aoMudar={(v) => atualizar({ ...p, escolhasDeClasse: { ...p.escolhasDeClasse, [e.id]: v } })}
        />
      ))}
    </section>
  )
}

/** Foto no cabeçalho da ficha: tocar abre a troca. Sem foto, um atalho discreto para adicionar. */
function BotaoRetrato({ p, somenteLeitura, aoMudar }: { p: Personagem; somenteLeitura: boolean; aoMudar: (r: string | undefined) => void }) {
  const [aberto, setAberto] = useState(false)
  if (somenteLeitura) return p.retrato ? <Retrato src={p.retrato} nome={p.nome} tamanho={72} /> : null
  return (
    <>
      <button
        type="button"
        className={`ficha__retrato ${p.retrato ? '' : 'ficha__retrato--vazio'}`}
        onClick={() => setAberto(true)}
        aria-label={p.retrato ? 'Trocar a foto' : 'Adicionar foto'}
      >
        {p.retrato ? <Retrato src={p.retrato} nome={p.nome} tamanho={72} /> : <Icone nome="foto" tamanho={24} />}
      </button>
      <Dialogo aberto={aberto} titulo="Foto do personagem" aoFechar={() => setAberto(false)}>
        <CampoRetrato valor={p.retrato} nome={p.nome} aoMudar={aoMudar} />
      </Dialogo>
    </>
  )
}

/** Lista de tudo o que existe na ficha, com um olho para mostrar ou esconder na aba Personalizada. */
function DialogoVisibilidade({
  aberto,
  aoFechar,
  blocos,
  layout,
  aoMudar,
}: {
  aberto: boolean
  aoFechar: () => void
  blocos: Bloco[]
  layout: Layout
  aoMudar: (l: Layout) => void
}) {
  const oculto = new Map(layout.map((x) => [x.id, x.oculto]))
  const visiveis = layout.filter((x) => !x.oculto).length
  return (
    <Dialogo
      aberto={aberto}
      titulo="O que aparece na aba Personalizada"
      aoFechar={aoFechar}
      rodape={
        <button type="button" className="botao botao--primario" onClick={aoFechar}>
          Pronto
        </button>
      }
    >
      <div className="visibilidade__topo">
        <p className="suave numeros">
          {visiveis} de {layout.length} à mostra
        </p>
        <div className="acoes">
          <button type="button" className="botao botao--fantasma" onClick={() => aoMudar(definirTodosOcultos(layout, false))}>
            Mostrar tudo
          </button>
          <button type="button" className="botao botao--fantasma" onClick={() => aoMudar(definirTodosOcultos(layout, true))}>
            Esconder tudo
          </button>
        </div>
      </div>
      {SECOES.map((secao) => {
        const daSecao = blocos.filter((b) => b.secao === secao.id)
        if (daSecao.length === 0) return null
        return (
          <section key={secao.id} className="visibilidade__grupo" aria-labelledby={`vis-${secao.id}`}>
            <h3 id={`vis-${secao.id}`} className="rotulo">
              {secao.titulo}
            </h3>
            <ul className="visibilidade__lista">
              {daSecao.map((b) => {
                const mostra = oculto.get(b.id) === false
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      className={`visibilidade__item ${mostra ? '' : 'visibilidade__item--oculto'}`}
                      aria-pressed={mostra}
                      onClick={() => aoMudar(alternarOculto(layout, b.id))}
                    >
                      <span>{b.titulo}</span>
                      <Icone nome={mostra ? 'olho' : 'olho_fechado'} />
                      <span className="visualmente-oculto">{mostra ? 'à mostra' : 'escondido'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </Dialogo>
  )
}
