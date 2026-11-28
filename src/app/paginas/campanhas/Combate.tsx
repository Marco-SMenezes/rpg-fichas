import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { aplicarAjustesPendentes } from '../../../combate/ponte'
import { ataquesDaFicha, ataquesDoMonstro } from '../../../combate/ataques'
import { textoDaEntrada } from '../../../combate/historico'
import {
  ajustarVidaLivre,
  ajustarVidaSimples,
  comCondicao,
  condicoesDaFicha,
  resumoDoPersonagem,
  vidaDaFichaLivre,
  type Vida,
} from '../../../combate/regras'
import { miniatura } from '../../../imagem/retrato'
import { lerFichaDaMesa, mesaDaCampanha, type FichaDaMesa, type MinhaCampanha } from '../../../nuvem/campanhas'
import { usuarioAtual } from '../../../nuvem/nuvem'
import {
  adicionarFichasEscondidas,
  adicionarJogadores,
  adicionarMonstros,
  alterarVidaDoJogador,
  alterarParticipante,
  alterarSegredo,
  atualizarMeuParticipante,
  carregarCombate,
  encerrarCombate,
  novoCombate,
  ouvirCombate,
  passarTurno,
  pedirAjuste,
  pedirAjusteDeCondicao,
  removerParticipante,
  type Entrada,
  type EstadoDoCombate,
  type NovaLinhaJogador,
  type Participante,
  type Segredo,
} from '../../../nuvem/combate'
import { CONDICOES } from '../../../regras/dnd5e/dados/condicoes'
import type { Monstro } from '../../../regras/dnd5e/dados/monstros/tipos'
import { calcularFicha } from '../../../regras/dnd5e/motor/ficha'
import { ajustarPV, marcarMorte, motivoDeCondicoes, motivoParaNaoAtacar, salvamentoContraMorte, situacaoDaMorte } from '../../../regras/dnd5e/motor/progressao'
import type { Personagem } from '../../../regras/dnd5e/tipos'
import { rolar as rolarExpressao, sinal } from '../../../rolagem/rolagem'
import { livres, useFichasLivres, useModelos } from '../../../universal/armazenamento'
import { BlocoMonstro } from '../../componentes/BlocoMonstro'
import { Retrato } from '../../componentes/CampoRetrato'
import { RetratoDeMonstro } from '../../componentes/IconeDeMonstro'
import { tipoDoResumo } from '../../../regras/dnd5e/dados/monstros/busca'
import { Dialogo } from '../../componentes/Dialogo'
import { Icone } from '../../componentes/Icone'
import { useRolador } from '../../componentes/Rolador'
import { personagens, usePersonagens } from '../../estado'
import { SeletorDeMonstro } from '../bestiario/Bestiario'
import { DialogoAtaque, type Alvo } from './Ataque'
import { AVISO_DE_MORTE, mortoNaLinha } from '../../../combate/morte'

type Acao = (f: () => Promise<unknown>) => void

export function Combate({ c }: { c: MinhaCampanha }) {
  const [estado, setEstado] = useState<EstadoDoCombate | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const { definirSecretaPorPadrao } = useRolador()

  // No combate, as rolagens do mestre (botão Dados) são secretas; ao sair, voltam a ir para a mesa.
  useEffect(() => {
    if (!c.souMestre) return
    definirSecretaPorPadrao(true)
    return () => definirSecretaPorPadrao(false)
  }, [c.souMestre, definirSecretaPorPadrao])

  const recarregar = useCallback(async () => {
    try {
      setEstado(await carregarCombate(c.id))
      setErro('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar o combate.')
    }
  }, [c.id])

  useEffect(() => {
    void recarregar()
    if (!c.souMestre) void aplicarAjustesPendentes()
    const parar = ouvirCombate(c.id, () => {
      clearTimeout(espera.current)
      espera.current = setTimeout(() => {
        void recarregar()
        if (!c.souMestre) void aplicarAjustesPendentes()
      }, 150)
    })
    return () => {
      clearTimeout(espera.current)
      parar()
    }
  }, [c.id, c.souMestre, recarregar])

  const acao: Acao = (f) => {
    setOcupado(true)
    setErro('')
    f()
      .catch((e) => setErro(e instanceof Error ? e.message : 'Algo deu errado.'))
      .finally(() => {
        setOcupado(false)
        void recarregar()
      })
  }

  if (!estado)
    return <section className="bloco combate">{erro ? <p className="aviso">{erro}</p> : <p className="suave">Carregando o combate…</p>}</section>

  const cb = estado.combate
  if (!cb)
    return (
      <section className="bloco combate">
        <h2>Combate</h2>
        {erro && <p className="aviso">{erro}</p>}
        <p className="suave">Nenhum combate agora.</p>
        {c.souMestre && (
          <div>
            <button type="button" className="botao botao--primario" disabled={ocupado} onClick={() => acao(() => novoCombate(c.id))}>
              <Icone nome="mais" />
              Novo combate
            </button>
          </div>
        )}
      </section>
    )

  return (
    <section className="bloco combate" aria-labelledby="t-combate">
      <div className="combate__cabeca">
        <h2 id="t-combate">
          Combate <span className="suave numeros">· Rodada {cb.rodada}</span>
        </h2>
        {c.souMestre && (
          <button
            type="button"
            className="botao botao--primario"
            disabled={ocupado || !estado.participantes.length}
            onClick={() => acao(() => passarTurno(estado))}
          >
            Próximo turno
            <Icone nome="avancar" />
          </button>
        )}
      </div>
      {erro && (
        <p className="aviso" role="alert">
          {erro}
        </p>
      )}
      {aviso && (
        <p className="suave" role="status">
          {aviso}
        </p>
      )}
      {c.souMestre && <BarraDoMestre c={c} estado={estado} acao={acao} ocupado={ocupado} setAviso={setAviso} />}

      {estado.participantes.length === 0 ? (
        <p className="suave">{c.souMestre ? 'Adicione os jogadores da mesa e os monstros.' : 'O mestre ainda está montando o combate.'}</p>
      ) : (
        <ol className="combate__lista">
          {estado.participantes.map((p) => (
            <Linha key={p.id} p={p} segredo={estado.segredos[p.id]} naVez={cb.vez === p.id} c={c} estado={estado} acao={acao} ocupado={ocupado} />
          ))}
        </ol>
      )}

      <Historico entradas={estado.historico} souMestre={c.souMestre} />
    </section>
  )
}

/** O mestre tira vida do alvo de um ataque, pelo mesmo caminho dos botões de vida. */
async function danoComoMestre(
  alvo: Participante,
  n: number,
  estado: EstadoDoCombate,
  fichas: Personagem[],
  fichasLivres: ReturnType<typeof useFichasLivres>,
  modelos: ReturnType<typeof useModelos>,
) {
  const minha = alvo.usuario !== null && alvo.usuario === usuarioAtual()
  const ficha = minha ? fichas.find((x) => x.id === alvo.personagem_id) : undefined
  if (ficha) return void personagens.salvar(ajustarPV(ficha, -n))
  const livre = minha ? fichasLivres.find((x) => x.id === alvo.personagem_id) : undefined
  const modelo = livre && modelos.find((m) => m.id === livre.modeloId)
  if (livre && modelo) return void livres.salvarFicha(ajustarVidaLivre(modelo, livre, -n))
  const s = estado.segredos[alvo.id]
  if (alvo.tipo === 'monstro' && s) {
    const v = ajustarVidaSimples({ pv: s.pv, pv_max: s.pv_max, pv_temp: s.pv_temp }, -n)
    return alterarSegredo(alvo.id, { pv: v.pv, pv_temp: v.pv_temp })
  }
  if (alvo.tipo === 'jogador' && alvo.pv !== null && alvo.pv_max !== null) {
    const v = ajustarVidaSimples({ pv: alvo.pv, pv_max: alvo.pv_max, pv_temp: alvo.pv_temp ?? 0 }, -n)
    await pedirAjuste(alvo.id, -n)
    await alterarVidaDoJogador(alvo.id, { pv: v.pv, pv_temp: v.pv_temp })
  }
}

/** O que aconteceu no combate, mais novo primeiro (o banco escreve; o mestre vê também o que é segredo). */
function Historico({ entradas, souMestre }: { entradas: Entrada[]; souMestre: boolean }) {
  // Agrupa por rodada, na ordem em que chegaram (mais nova em cima).
  const grupos: { rodada: number; itens: Entrada[] }[] = []
  for (const e of entradas) {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.rodada === e.rodada) ultimo.itens.push(e)
    else grupos.push({ rodada: e.rodada, itens: [e] })
  }
  return (
    <details className="combate__historico">
      <summary>
        Histórico <span className="suave numeros">({entradas.length})</span>
      </summary>
      {entradas.length === 0 ? (
        <p className="suave">Nada ainda. Dano, cura, condições e turnos aparecem aqui.</p>
      ) : (
        grupos.map((g, i) => (
          <section key={i} className="combate__historico-rodada" aria-label={`Rodada ${g.rodada}`}>
            <h3 className="rotulo">Rodada {g.rodada}</h3>
            <ol>
              {g.itens
                .filter((e) => e.tipo !== 'rodada')
                .map((e) => (
                  <li key={e.id} className={`combate__entrada combate__entrada--${e.tipo}`}>
                    <span>{textoDaEntrada(e)}</span>
                    {souMestre && e.so_mestre && (
                      <span className="etiqueta" title="Os jogadores não veem esta linha">
                        só você
                      </span>
                    )}
                    <time className="suave numeros" dateTime={e.criado_em}>
                      {new Date(e.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </li>
                ))}
            </ol>
          </section>
        ))
      )}
    </details>
  )
}

/* ---------- Ferramentas do mestre ---------- */

/** Linha do combate a partir de uma ficha (de jogador ou do próprio mestre). */
async function linhaDaFicha(f: FichaDaMesa, usuario: string): Promise<NovaLinhaJogador & { ca: number }> {
  if (f.tipo === 'dnd5e') {
    const p = f.personagem
    const ficha = calcularFicha(p)
    return {
      personagem_id: p.id,
      usuario,
      nome: p.nome,
      resumo: resumoDoPersonagem(p),
      foto: p.retrato ? await miniatura(p.retrato).catch(() => null) : null,
      desempate: ficha.iniciativa,
      pv: p.estado.pvAtual,
      pv_max: ficha.pvMaximo,
      pv_temp: p.estado.pvTemporario,
      condicoes: condicoesDaFicha(p),
      ca: ficha.ca.valor,
    }
  }
  const v = vidaDaFichaLivre(f.modelo, f.ficha)
  return {
    personagem_id: f.ficha.id,
    usuario,
    nome: f.ficha.nome,
    resumo: `Personalizada · ${f.modelo.nome}`,
    foto: null,
    desempate: 0,
    pv: v?.pv ?? 0,
    pv_max: v?.max ?? 0,
    pv_temp: 0,
    ca: 10,
  }
}

function BarraDoMestre({
  c,
  estado,
  acao,
  ocupado,
  setAviso,
}: {
  c: MinhaCampanha
  estado: EstadoDoCombate
  acao: Acao
  ocupado: boolean
  setAviso: (t: string) => void
}) {
  const [escolhendo, setEscolhendo] = useState(false)
  const [meus, setMeus] = useState(false)
  const [encerrando, setEncerrando] = useState(false)
  const cb = estado.combate!

  async function trazerJogadores() {
    const mesa = await mesaDaCampanha(c.id)
    const ja = new Set(estado.participantes.map((p) => p.personagem_id))
    const linhas: NovaLinhaJogador[] = []
    let deFora = 0
    for (const m of mesa) {
      if (!m.personagem_id) {
        deFora++
        continue
      }
      if (ja.has(m.personagem_id)) continue
      const f = await lerFichaDaMesa(m.personagem_id).catch(() => null)
      if (!f) {
        deFora++
        continue
      }
      linhas.push(await linhaDaFicha(f, m.usuario))
    }
    await adicionarJogadores(cb.id, linhas)
    setAviso(
      [
        linhas.length
          ? `${linhas.length} ${linhas.length === 1 ? 'jogador entrou' : 'jogadores entraram'} no combate.`
          : 'Nenhum jogador novo para entrar.',
        deFora ? `${deFora} ${deFora === 1 ? 'jogador sem ficha na nuvem ficou de fora' : 'jogadores sem ficha na nuvem ficaram de fora'}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    )
  }

  function rolarIniciativaDosMonstros() {
    const sem = estado.participantes.filter((p) => p.tipo === 'monstro' && p.iniciativa === null)
    if (!sem.length) {
      setAviso('Todos os monstros já têm iniciativa.')
      return
    }
    acao(async () => {
      for (const p of sem) {
        const r = rolarExpressao(`1d20${sinal(p.desempate)}`, { rotulo: `Iniciativa · ${p.nome}`, secreta: true })
        if (r) await alterarParticipante(p.id, { iniciativa: r.total })
      }
      setAviso(`Iniciativa rolada em segredo para ${sem.length} ${sem.length === 1 ? 'monstro' : 'monstros'}.`)
    })
  }

  return (
    <div className="combate__barra">
      <button type="button" className="botao" disabled={ocupado} onClick={() => acao(trazerJogadores)}>
        <Icone nome="mais" />
        Jogadores da mesa
      </button>
      <button type="button" className="botao" disabled={ocupado} onClick={() => setEscolhendo(true)}>
        <Icone nome="mais" />
        Monstro
      </button>
      <button type="button" className="botao" disabled={ocupado} onClick={() => setMeus(true)}>
        <Icone nome="mais" />
        Meus personagens
      </button>
      <button type="button" className="botao" disabled={ocupado} onClick={rolarIniciativaDosMonstros}>
        <Icone nome="d20" />
        Iniciativa dos monstros
      </button>
      <button type="button" className="botao botao--fantasma" disabled={ocupado} onClick={() => setEncerrando(true)}>
        Encerrar
      </button>

      <DialogoMonstro
        aberto={escolhendo}
        soMeus={c.sistema === 'personalizada'}
        aoFechar={() => setEscolhendo(false)}
        aoAdicionar={(m, qtd, rolar) => {
          setEscolhendo(false)
          acao(async () => {
            // Foto do monstro vira miniatura (a do bestiário é grande demais para a linha do combate).
            const foto = m.foto ? await miniatura(m.foto).catch(() => undefined) : undefined
            const comFoto: Monstro = { ...m }
            if (foto) comFoto.foto = foto
            else delete comFoto.foto
            await adicionarMonstros(
              cb.id,
              comFoto,
              qtd,
              rolar,
              estado.participantes.map((p) => p.nome),
            )
          })
        }}
      />
      <DialogoMeusPersonagens
        aberto={meus}
        c={c}
        jaNoCombate={estado.participantes.map((p) => p.personagem_id).filter((x): x is string => !!x)}
        aoFechar={() => setMeus(false)}
        aoEscolher={(f, escondido) => {
          setMeus(false)
          const eu = usuarioAtual()
          if (!eu) return
          acao(async () => {
            const l = await linhaDaFicha(f, eu)
            if (escondido) await adicionarFichasEscondidas(cb.id, [l])
            else await adicionarJogadores(cb.id, [l])
            setAviso(`${l.nome} entrou no combate ${escondido ? 'escondido (só você vê a vida)' : 'como aliado'}.`)
          })
        }}
      />
      <Dialogo
        aberto={encerrando}
        titulo="Encerrar o combate"
        aoFechar={() => setEncerrando(false)}
        rodape={
          <>
            <button type="button" className="botao" onClick={() => setEncerrando(false)}>
              Continuar o combate
            </button>
            <button
              type="button"
              className="botao botao--perigo"
              onClick={() => {
                setEncerrando(false)
                acao(() => encerrarCombate(cb.id))
              }}
            >
              Encerrar
            </button>
          </>
        }
      >
        <p>A ordem, os monstros e a vida deles somem. A vida dos jogadores continua nas fichas.</p>
      </Dialogo>
    </div>
  )
}

/** As fichas do mestre (do sistema da campanha) que ainda não estão no combate. */
function DialogoMeusPersonagens({
  aberto,
  c,
  jaNoCombate,
  aoFechar,
  aoEscolher,
}: {
  aberto: boolean
  c: MinhaCampanha
  jaNoCombate: string[]
  aoFechar: () => void
  aoEscolher: (f: FichaDaMesa, escondido: boolean) => void
}) {
  const fichas = usePersonagens()
  const fichasLivres = useFichasLivres()
  const modelos = useModelos()
  const opcoes: { id: string; nome: string; resumo: string; foto?: string; ficha: FichaDaMesa }[] =
    c.sistema === 'personalizada'
      ? fichasLivres.flatMap((f) => {
          const modelo = modelos.find((m) => m.id === f.modeloId)
          return modelo
            ? [{ id: f.id, nome: f.nome, resumo: `Personalizada · ${modelo.nome}`, ficha: { tipo: 'livre' as const, ficha: f, modelo } }]
            : []
        })
      : fichas.map((p) => ({
          id: p.id,
          nome: p.nome,
          resumo: resumoDoPersonagem(p),
          ...(p.retrato ? { foto: p.retrato } : {}),
          ficha: { tipo: 'dnd5e' as const, personagem: p },
        }))
  const livresParaEntrar = opcoes.filter((o) => !jaNoCombate.includes(o.id))
  return (
    <Dialogo aberto={aberto} titulo="Meus personagens no combate" aoFechar={aoFechar}>
      <p className="suave">
        <strong>Aliado:</strong> a mesa vê a vida, como a dos jogadores. <strong>Escondido:</strong> a mesa vê só o nome e a iniciativa; a vida fica
        só com você. A sua ficha continua mandando na vida.
      </p>
      {livresParaEntrar.length === 0 ? (
        <p className="suave">
          {opcoes.length
            ? 'Todos os seus personagens já estão no combate.'
            : `Você não tem fichas ${c.sistema === 'personalizada' ? 'personalizadas' : 'de D&D 5e'} neste aparelho.`}
        </p>
      ) : (
        <ul className="combate__minhas">
          {livresParaEntrar.map((o) => (
            <li key={o.id} className="combate__minha">
              <Retrato src={o.foto} nome={o.nome} tamanho={40} />
              <span className="combate__texto">
                <span className="combate__nome">{o.nome}</span>
                <span className="combate__resumo suave">{o.resumo}</span>
              </span>
              <span className="combate__escolha">
                <button type="button" className="botao" onClick={() => aoEscolher(o.ficha, false)} aria-label={`${o.nome} como aliado`}>
                  Aliado
                </button>
                <button type="button" className="botao" onClick={() => aoEscolher(o.ficha, true)} aria-label={`${o.nome} escondido`}>
                  Escondido
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Dialogo>
  )
}

function DialogoMonstro({
  aberto,
  soMeus,
  aoFechar,
  aoAdicionar,
}: {
  aberto: boolean
  soMeus: boolean
  aoFechar: () => void
  aoAdicionar: (m: Monstro, quantidade: number, rolarPV: boolean) => void
}) {
  const [escolhido, setEscolhido] = useState<Monstro | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [rolar, setRolar] = useState(false)
  const fechar = () => {
    setEscolhido(null)
    aoFechar()
  }
  return (
    <Dialogo
      aberto={aberto}
      titulo={escolhido ? `Adicionar ${escolhido.nome}` : 'Escolher monstro'}
      aoFechar={fechar}
      rodape={
        escolhido ? (
          <>
            <button type="button" className="botao" onClick={() => setEscolhido(null)}>
              Voltar
            </button>
            <button
              type="button"
              className="botao botao--primario"
              onClick={() => {
                aoAdicionar(escolhido, quantidade, rolar)
                setEscolhido(null)
                setQuantidade(1)
              }}
            >
              <Icone nome="mais" />
              Adicionar {quantidade > 1 ? `${quantidade} ` : ''}ao combate
            </button>
          </>
        ) : undefined
      }
    >
      {escolhido ? (
        <div className="combate__adicionar">
          <label className="campo">
            <span className="rotulo">Quantidade</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Math.min(20, Math.trunc(Number(e.target.value)) || 1)))}
            />
          </label>
          <label className="alternar">
            <input type="checkbox" checked={rolar} onChange={(e) => setRolar(e.target.checked)} />
            Rolar os PV ({escolhido.dadosDeVida || 'sem dados de vida'}) em vez de usar a média ({escolhido.pv})
          </label>
          <BlocoMonstro m={escolhido} />
        </div>
      ) : (
        <SeletorDeMonstro soMeus={soMeus} aoEscolher={setEscolhido} />
      )}
    </Dialogo>
  )
}

/* ---------- Linha de cada participante ---------- */

function Linha({
  p,
  segredo,
  naVez,
  c,
  estado,
  acao,
  ocupado,
}: {
  p: Participante
  segredo: Segredo | undefined
  naVez: boolean
  c: MinhaCampanha
  estado: EstadoDoCombate
  acao: Acao
  ocupado: boolean
}) {
  const fichas = usePersonagens()
  const fichasLivres = useFichasLivres()
  const modelos = useModelos()
  const [abrindo, setAbrindo] = useState(false)
  const [condicoes, setCondicoes] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [atacando, setAtacando] = useState(false)
  const { rolar } = useRolador()

  // Linha ligada a uma ficha minha: do jogador, ou do mestre (aliado ou escondido). A ficha manda na vida.
  const meu = p.usuario !== null && p.usuario === usuarioAtual() && p.personagem_id !== null
  const fichaMinha = meu ? fichas.find((x) => x.id === p.personagem_id) : undefined
  const livreMinha = meu && !fichaMinha ? fichasLivres.find((x) => x.id === p.personagem_id) : undefined
  const modeloMeu = livreMinha ? modelos.find((m) => m.id === livreMinha.modeloId) : undefined
  const minha = !!(fichaMinha || (livreMinha && modeloMeu))
  // Morto neste combate (três falhas): o dono não faz mais nada e só o mestre traz de volta. A ficha local vale na hora; a linha vale para a mesa.
  const morto = fichaMinha && p.tipo === 'jogador' ? situacaoDaMorte(fichaMinha) === 'morto' : mortoNaLinha(p)
  const travadoPeloMorte = morto && !c.souMestre

  // Vida mostrada: a ficha local (se for minha), o segredo (monstro, mestre) ou a linha pública (jogador).
  const vida: Vida | null = useMemo(() => {
    if (fichaMinha) return { pv: fichaMinha.estado.pvAtual, pv_max: calcularFicha(fichaMinha).pvMaximo, pv_temp: fichaMinha.estado.pvTemporario }
    if (livreMinha && modeloMeu) {
      const v = vidaDaFichaLivre(modeloMeu, livreMinha)
      return v ? { pv: v.pv, pv_max: v.max, pv_temp: 0 } : null
    }
    if (p.tipo === 'monstro') return segredo ? { pv: segredo.pv, pv_max: segredo.pv_max, pv_temp: segredo.pv_temp } : null
    if (p.pv === null || p.pv_max === null) return null
    return { pv: p.pv, pv_max: p.pv_max, pv_temp: p.pv_temp ?? 0 }
  }, [fichaMinha, livreMinha, modeloMeu, p, segredo])

  // O que o mestre grava parte do valor na tela: enquanto grava, trava os botões para não perder cliques.
  const travado = c.souMestre && ocupado

  const podeMexer = ((c.souMestre && (p.tipo === 'monstro' ? !!segredo : true)) || minha) && !travadoPeloMorte
  const mexer = (delta: number) => {
    if (fichaMinha) personagens.salvar(ajustarPV(fichaMinha, delta))
    else if (livreMinha && modeloMeu) livres.salvarFicha(ajustarVidaLivre(modeloMeu, livreMinha, delta))
    else if (c.souMestre && p.tipo === 'monstro' && segredo) {
      const v = ajustarVidaSimples({ pv: segredo.pv, pv_max: segredo.pv_max, pv_temp: segredo.pv_temp }, delta)
      acao(() => alterarSegredo(p.id, { pv: v.pv, pv_temp: v.pv_temp }))
    } else if (c.souMestre && p.tipo === 'jogador' && vida) {
      // A linha muda na hora para todos; o aparelho do jogador aplica o ajuste na ficha e confirma.
      const v = ajustarVidaSimples(vida, delta)
      acao(async () => {
        await pedirAjuste(p.id, delta)
        await alterarVidaDoJogador(p.id, { pv: v.pv, pv_temp: v.pv_temp })
      })
    }
  }

  const podeIniciativa = (c.souMestre || minha) && !travadoPeloMorte
  const mudarIniciativa = (n: number | null) => {
    if (c.souMestre) acao(() => alterarParticipante(p.id, { iniciativa: n }))
    else acao(() => atualizarMeuParticipante(p.id, { iniciativa: n }))
  }

  // Condições: da ficha (se for minha), do segredo (monstro, só o mestre) ou da linha (jogador, a mesa vê).
  const conds = fichaMinha ? condicoesDaFicha(fichaMinha) : p.tipo === 'monstro' ? (segredo?.condicoes ?? []) : p.condicoes
  const podeCondicao = !travadoPeloMorte && (!!fichaMinha || (!!livreMinha && p.tipo === 'jogador') || (c.souMestre && (p.tipo === 'jogador' || !!segredo)))
  const marcarCondicao = (nome: string, ligar: boolean) => {
    const nova = ligar ? [...conds, nome] : conds.filter((x) => x !== nome)
    if (fichaMinha) personagens.salvar(comCondicao(fichaMinha, nome, ligar))
    else if (c.souMestre && p.tipo === 'monstro' && segredo) acao(() => alterarSegredo(p.id, { condicoes: nova }))
    else if (c.souMestre && p.tipo === 'jogador') acao(() => pedirAjusteDeCondicao(p, nome, ligar))
    else if (livreMinha) acao(() => atualizarMeuParticipante(p.id, { condicoes: nova }))
  }

  // Ataque com alvo: o mestre ataca com monstros e fichas dele; o jogador, com a própria ficha, contra monstros.
  const ataques = useMemo(
    () => (fichaMinha ? ataquesDaFicha(fichaMinha) : c.souMestre && segredo?.monstro ? ataquesDoMonstro(segredo.monstro) : []),
    [fichaMinha, c.souMestre, segredo],
  )
  const podeAtacar = (c.souMestre && (!!fichaMinha || !!segredo?.monstro)) || (!c.souMestre && !!fichaMinha && p.tipo === 'jogador')
  // Quem está com 0 PV está inconsciente e não age: o botão fica à vista, mas desativado.
  const semAtaque = travadoPeloMorte ? AVISO_DE_MORTE : fichaMinha ? motivoParaNaoAtacar(fichaMinha) : vida && vida.pv === 0 ? 'Caído com 0 PV: não pode atacar.' : motivoDeCondicoes(conds)
  const alvos: Alvo[] = c.souMestre
    ? estado.participantes.filter((x) => x.id !== p.id).map((x) => ({ p: x, ca: x.tipo === 'monstro' ? (estado.segredos[x.id]?.ca ?? null) : x.ca }))
    : estado.participantes.filter((x) => x.tipo === 'monstro').map((x) => ({ p: x, ca: null }))
  const aplicarDano = (alvo: Participante, n: number) => danoComoMestre(alvo, n, estado, fichas, fichasLivres, modelos)

  const caido = vida ? vida.pv === 0 : false
  return (
    <li
      className={`combate__linha${naVez ? ' combate__linha--vez' : ''}${caido ? ' combate__linha--caido' : ''}${morto ? ' combate__linha--morto' : ''}`}
      aria-current={naVez ? 'true' : undefined}
    >
      <span className="combate__seta" aria-hidden="true">
        {naVez ? '▶' : ''}
      </span>
      <span className="combate__retrato">
        {p.tipo === 'monstro' && (segredo?.monstro?.tipo || tipoDoResumo(p.resumo)) ? (
          <RetratoDeMonstro foto={p.foto} tipo={segredo?.monstro?.tipo || tipoDoResumo(p.resumo)} nome={p.nome} tamanho={48} />
        ) : (
          <Retrato src={p.foto ?? undefined} nome={p.nome} tamanho={48} />
        )}
      </span>
      <span className="combate__texto">
        {c.souMestre && p.tipo === 'monstro' && segredo?.monstro ? (
          <button type="button" className="combate__nome combate__nome--botao" onClick={() => setAbrindo(true)} title="Ver a ficha do monstro">
            {p.nome}
          </button>
        ) : (
          <span className="combate__nome">{p.nome}</span>
        )}
        <span className="combate__resumo suave">
          {p.resumo}
          {c.souMestre && segredo && <> · CA {segredo.ca}</>}
        </span>
        {conds.length > 0 && (
          <span className="combate__condicoes">
            {conds.map((x) => (
              <span key={x} className="etiqueta">
                {x}
              </span>
            ))}
          </span>
        )}
      </span>

      <Iniciativa valor={p.iniciativa} editavel={podeIniciativa} aoMudar={mudarIniciativa} nome={p.nome} />

      <span className="combate__vida">
        {vida ? (
          podeMexer ? (
            <span className="combate__pv">
              <button
                type="button"
                className="pv__botao"
                onClick={() => mexer(-1)}
                aria-label={`Tirar 1 PV de ${p.nome}`}
                disabled={travado || vida.pv + vida.pv_temp === 0}
              >
                <Icone nome="menos" />
              </button>
              <ValorDeVida
                vida={vida}
                nome={p.nome}
                monstro={p.tipo === 'monstro'}
                travado={travado}
                aoDefinir={(total) => mexer(total - (vida.pv + vida.pv_temp))}
              />
              <button type="button" className="pv__botao" onClick={() => mexer(1)} aria-label={`Dar 1 PV a ${p.nome}`} disabled={travado}>
                <Icone nome="mais" />
              </button>
            </span>
          ) : (
            <span className="numeros suave">
              {vida.pv}/{vida.pv_max}
              {vida.pv_temp > 0 && ` +${vida.pv_temp}`}
            </span>
          )
        ) : null}
        {p.tipo === 'jogador' && vida && vida.pv === 0 && vida.pv_temp === 0 && <TestesDeMorte p={p} ficha={fichaMinha} rolar={rolar} travado={travadoPeloMorte} />}
        {(c.souMestre || podeCondicao || podeAtacar) && (
          <span className="combate__acoes">
            {c.souMestre && morto && (
              <button
                type="button"
                className="botao"
                disabled={travado}
                title="Devolve 1 PV e zera os testes contra a morte"
                onClick={() =>
                  acao(async () => {
                    await pedirAjuste(p.id, 1)
                    await alterarVidaDoJogador(p.id, { pv: 1, pv_temp: 0 })
                  })
                }
              >
                Trazer de volta
              </button>
            )}
            {podeAtacar && (
              <button
                type="button"
                className="botao botao--fantasma botao--icone"
                onClick={() => setAtacando(true)}
                disabled={!!semAtaque}
                aria-label={`Atacar com ${p.nome}`}
                title={semAtaque ?? 'Atacar'}
              >
                <Icone nome="espada" />
              </button>
            )}
            {podeCondicao && (
              <button
                type="button"
                className="botao botao--fantasma botao--icone"
                onClick={() => setCondicoes(true)}
                aria-label={`Condições de ${p.nome}`}
                title="Condições"
              >
                <Icone nome="ajustes" />
              </button>
            )}
            {c.souMestre && (
              <button
                type="button"
                className="botao botao--fantasma botao--icone"
                onClick={() => setRemovendo(true)}
                aria-label={`Tirar ${p.nome} do combate`}
                title="Tirar do combate"
              >
                <Icone nome="fechar" />
              </button>
            )}
          </span>
        )}
      </span>

      {podeAtacar && (
        <DialogoAtaque
          aberto={atacando}
          aoFechar={() => setAtacando(false)}
          atacante={p}
          ataques={ataques}
          alvos={alvos}
          comoMestre={c.souMestre}
          aplicarDano={aplicarDano}
        />
      )}
      {segredo?.monstro && (
        <Dialogo aberto={abrindo} titulo={p.nome} aoFechar={() => setAbrindo(false)}>
          <p className="suave">As rolagens daqui são secretas: só você vê.</p>
          <BlocoMonstro m={segredo.monstro} aoRolar={(expr, rotulo) => rolar(expr, { rotulo: `${p.nome} · ${rotulo}`, secreta: true })} />
        </Dialogo>
      )}
      {podeCondicao && (
        <Dialogo aberto={condicoes} titulo={`Condições · ${p.nome}`} aoFechar={() => setCondicoes(false)}>
          {c.souMestre && p.tipo === 'jogador' && !fichaMinha && <p className="suave">Vai também para a ficha do jogador.</p>}
          <div className="combate__lista-condicoes">
            {CONDICOES.map((cd) => {
              const tem = conds.includes(cd.nome)
              return (
                <label key={cd.id} className="alternar">
                  <input type="checkbox" checked={tem} disabled={travado} onChange={() => marcarCondicao(cd.nome, !tem)} />
                  {cd.nome}
                </label>
              )
            })}
          </div>
        </Dialogo>
      )}
      <Dialogo
        aberto={removendo}
        titulo="Tirar do combate"
        aoFechar={() => setRemovendo(false)}
        rodape={
          <>
            <button type="button" className="botao" onClick={() => setRemovendo(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="botao botao--perigo"
              onClick={() => {
                setRemovendo(false)
                acao(() => removerParticipante(estado, p.id))
              }}
            >
              Tirar
            </button>
          </>
        }
      >
        <p>
          <strong>{p.nome}</strong> sai da ordem de iniciativa.
        </p>
      </Dialogo>
    </li>
  )
}

function Iniciativa({
  valor,
  editavel,
  aoMudar,
  nome,
}: {
  valor: number | null
  editavel: boolean
  aoMudar: (n: number | null) => void
  nome: string
}) {
  const [texto, setTexto] = useState<string | null>(null)
  if (!editavel)
    return (
      <span className="combate__inic numeros" title="Iniciativa">
        <span className="rotulo">Inic.</span> {valor ?? '—'}
      </span>
    )
  return (
    <label className="combate__inic numeros">
      <span className="rotulo">Inic.</span>
      <input
        type="text"
        inputMode="numeric"
        value={texto ?? (valor === null ? '' : String(valor))}
        placeholder="—"
        aria-label={`Iniciativa de ${nome}`}
        onChange={(e) => setTexto(e.target.value.replace(/[^\d-]/g, ''))}
        onBlur={() => {
          if (texto === null) return
          const n = texto === '' || texto === '-' ? null : Math.trunc(Number(texto))
          if (n !== valor && (n === null || Number.isFinite(n))) aoMudar(n)
          setTexto(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </label>
  )
}

/** Vida: tocar no número abre o campo para digitar o valor (como na ficha). */
function ValorDeVida({
  vida,
  nome,
  monstro,
  travado,
  aoDefinir,
}: {
  vida: Vida
  nome: string
  monstro: boolean
  travado: boolean
  aoDefinir: (total: number) => void
}) {
  const [texto, setTexto] = useState<string | null>(null)
  const total = vida.pv + vida.pv_temp
  if (texto !== null) {
    const confirmar = () => {
      const n = Math.trunc(Number(texto))
      if (texto.trim() !== '' && Number.isFinite(n) && n >= 0 && n !== total) aoDefinir(n)
      setTexto(null)
    }
    return (
      <input
        className="combate__pv-entrada numeros"
        type="number"
        inputMode="numeric"
        min={0}
        autoFocus
        value={texto}
        aria-label={`Vida nova de ${nome}`}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmar()
          if (e.key === 'Escape') setTexto(null)
        }}
      />
    )
  }
  return (
    <button
      type="button"
      className="numeros combate__pv-valor"
      disabled={travado}
      onClick={() => setTexto(String(total))}
      aria-label={`Vida de ${nome}: ${vida.pv} de ${vida.pv_max}${vida.pv_temp ? ` mais ${vida.pv_temp} temporários` : ''}. Tocar para digitar.`}
    >
      {monstro ? 'PV ' : ''}
      {vida.pv}/{vida.pv_max}
      {vida.pv_temp > 0 && <span className="suave"> +{vida.pv_temp}</span>}
    </button>
  )
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

/**
 * Testes contra a morte de quem caiu a 0 PV. O dono da ficha (jogador, ou o mestre nas fichas dele)
 * rola e marca com as regras da ficha; a mesa vê as marcas que a ficha manda para a linha.
 */
function TestesDeMorte({
  p,
  ficha,
  rolar,
  travado,
}: {
  p: Participante
  ficha: Personagem | undefined
  rolar: ReturnType<typeof useRolador>['rolar']
  /** Morto neste combate: o dono não mexe mais nas marcas nem rola. */
  travado: boolean
}) {
  const sucessos = ficha ? ficha.estado.morte.sucessos : (p.morte_sucessos ?? 0)
  const falhas = ficha ? ficha.estado.morte.falhas : (p.morte_falhas ?? 0)
  const situacao = ficha ? situacaoDaMorte(ficha) : falhas >= 3 ? 'morto' : sucessos >= 3 ? 'estavel' : 'morrendo'
  const marcas = (tipo: 'sucessos' | 'falhas', atual: number) => (
    <span className={`morte__marcas morte__linha--${tipo}`} aria-hidden={!ficha}>
      {[1, 2, 3].map((i) =>
        ficha ? (
          <button
            key={i}
            type="button"
            className="morte__marca"
            aria-pressed={atual >= i}
            disabled={travado}
            aria-label={`${tipo === 'sucessos' ? 'Sucessos' : 'Falhas'} de ${p.nome}: ${i}`}
            onClick={() => personagens.salvar(marcarMorte(ficha, tipo, atual >= i ? i - 1 : i))}
          />
        ) : (
          <span key={i} className="morte__marca" aria-pressed={atual >= i} />
        ),
      )}
    </span>
  )
  return (
    <span className="combate__morte" role="group" aria-label={`Testes contra a morte de ${p.nome}`}>
      <span className={`combate__morte-situacao combate__morte-situacao--${situacao}`}>
        {situacao === 'morto' ? 'Morto' : situacao === 'estavel' ? 'Estável' : 'Morrendo'}
        <span className="visualmente-oculto">
          {' '}
          · {plural(sucessos, 'sucesso', 'sucessos')} · {plural(falhas, 'falha', 'falhas')}
        </span>
      </span>
      <span className="combate__morte-linha" title={plural(sucessos, 'sucesso', 'sucessos')}>
        <span className="combate__morte-sinal combate__morte-sinal--sucesso" aria-hidden="true">
          ✓
        </span>
        {marcas('sucessos', sucessos)}
      </span>
      <span className="combate__morte-linha" title={plural(falhas, 'falha', 'falhas')}>
        <span className="combate__morte-sinal combate__morte-sinal--falha" aria-hidden="true">
          ✗
        </span>
        {marcas('falhas', falhas)}
      </span>
      {travado && <span className="combate__morte-aviso">Só o mestre pode trazer de volta.</span>}
      {ficha && situacao === 'morrendo' && (
        <button
          type="button"
          className="botao"
          onClick={() => {
            const r = rolar('1d20', { rotulo: `Teste contra a morte · ${p.nome}`, modo: 'normal' })
            if (r?.d20) personagens.salvar(salvamentoContraMorte(ficha, r.d20))
          }}
        >
          <Icone nome="d20" />
          Teste contra a morte
        </button>
      )}
    </span>
  )
}
