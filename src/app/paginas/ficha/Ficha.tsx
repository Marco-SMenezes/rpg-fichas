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
import { blocosDisponiveis, SECOES } from './blocos'
import type { DialogoFicha } from './contexto'
import { DialogoDescanso, DialogoNivel, DialogoVida } from './Dialogos'
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
  const [aba, setAba] = useState<string>('geral')
  const tela = useTela()
  const conjurador = f.conjuracao !== null
  // Recalcula a lista só quando muda o que define quais blocos existem.
  const blocos = useMemo(() => blocosDisponiveis(f), [conjurador])
  const atualizar = (novo: Personagem) => (somenteLeitura ? novo : personagens.salvar(novo))
  const { layout, definir, restaurar, personalizado } = useLayout(p, atualizar, blocos, tela, somenteLeitura)
  // Abas com algum bloco à vista. Organizando, aparecem todas, para dar para levar blocos a uma aba vazia.
  const abas = SECOES.filter((x) => editando || layout.some((i) => i.secao === x.id && !i.oculto))
  const abaAtual = abas.some((x) => x.id === aba) ? aba : (abas[0]?.id ?? 'geral')
  const fechar = () => setDialogo(null)
  const props = { p, f, atualizar, abrir: setDialogo }

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
            <button
              type="button"
              className="botao"
              onClick={() => setDialogo('nivel')}
              disabled={p.nivel >= 20}
              aria-label="Subir de nível"
            >
              <Icone nome="seta_cima" />
              <span className="so-largo">Subir de nível</span>
              <span className="so-estreito" aria-hidden="true">
                Nível
              </span>
            </button>
          </>
          )
        }
      />
      <main id="conteudo" tabIndex={-1} className="pagina ficha">
        <header className="ficha__cabeca">
          <BotaoRetrato p={p} somenteLeitura={somenteLeitura} aoMudar={(retrato) => atualizar({ ...p, retrato })} />
          <div className="ficha__titulo">
            <p className="rotulo">{resumoPersonagem(p)}</p>
            <h1>{p.nome}</h1>
            {p.conceito && <p className="suave">{p.conceito}</p>}
          </div>
          {somenteLeitura && <p className="etiqueta">Só leitura</p>}
          {!editando && !somenteLeitura && (
            <button type="button" className="botao" onClick={() => setEditando(true)}>
              <Icone nome="grade" />
              Organizar
            </button>
          )}
        </header>

        {editando && (
          <div className="barra-organizar" role="region" aria-label="Organizando a ficha">
            <p>
              <strong>Organizando.</strong> Arraste pela alça <Icone nome="alca" tamanho={16} /> ou toque em{' '}
              <Icone nome="ajustes" tamanho={16} /> para mudar largura, posição ou esconder.{' '}
              {tela === 'larga' ? 'Este layout vale para telas largas.' : 'Este layout vale para o celular.'}
            </p>
            <div className="acoes">
              {personalizado && (
                <button type="button" className="botao botao--fantasma" onClick={restaurar}>
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

        {!somenteLeitura && <EscolhasPendentes p={p} atualizar={atualizar} />}

        <nav className="abas-ficha" aria-label="Seções da ficha">
          {abas.map((x) => (
            <button key={x.id} type="button" className="abas-ficha__aba" aria-current={x.id === abaAtual ? 'page' : undefined} onClick={() => setAba(x.id)}>
              {x.titulo}
            </button>
          ))}
        </nav>

        {somenteLeitura ? (
          // fieldset desativado: todos os campos e botões da ficha ficam só para ver.
          <fieldset disabled className="somente-leitura">
            <legend className="visualmente-oculto">Ficha só para leitura</legend>
            <Painel {...props} blocos={blocos} layout={layout} secao={abaAtual} tela={tela} editando={false} aoMudarLayout={definir} />
          </fieldset>
        ) : (
          <Painel {...props} blocos={blocos} layout={layout} secao={abaAtual} tela={tela} editando={editando} aoMudarLayout={definir} />
        )}
      </main>

      <DialogoVida aberto={!somenteLeitura && dialogo === 'vida'} aoFechar={fechar} p={p} f={f} atualizar={atualizar} />
      <DialogoDescanso aberto={dialogo === 'descanso'} aoFechar={fechar} p={p} f={f} atualizar={atualizar} />
      <DialogoNivel aberto={dialogo === 'nivel'} aoFechar={fechar} p={p} f={f} atualizar={atualizar} />
    </>
  )
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
