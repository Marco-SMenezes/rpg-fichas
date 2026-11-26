import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { aplicarAjustesPendentes } from '../../../combate/ponte'
import { ajustarVidaLivre, ajustarVidaSimples, resumoDoPersonagem, vidaDaFichaLivre, type Vida } from '../../../combate/regras'
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
  removerParticipante,
  type EstadoDoCombate,
  type NovaLinhaJogador,
  type Participante,
  type Segredo,
} from '../../../nuvem/combate'
import { CONDICOES } from '../../../regras/dnd5e/dados/condicoes'
import type { Monstro } from '../../../regras/dnd5e/dados/monstros/tipos'
import { calcularFicha } from '../../../regras/dnd5e/motor/ficha'
import { ajustarPV } from '../../../regras/dnd5e/motor/progressao'
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

type Acao = (f: () => Promise<unknown>) => void

export function Combate({ c }: { c: MinhaCampanha }) {
  const [estado, setEstado] = useState<EstadoDoCombate | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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
    </section>
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
  const { rolar } = useRolador()

  // Linha ligada a uma ficha minha: do jogador, ou do mestre (aliado ou escondido). A ficha manda na vida.
  const meu = p.usuario !== null && p.usuario === usuarioAtual() && p.personagem_id !== null
  const fichaMinha = meu ? fichas.find((x) => x.id === p.personagem_id) : undefined
  const livreMinha = meu && !fichaMinha ? fichasLivres.find((x) => x.id === p.personagem_id) : undefined
  const modeloMeu = livreMinha ? modelos.find((m) => m.id === livreMinha.modeloId) : undefined
  const minha = !!(fichaMinha || (livreMinha && modeloMeu))

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

  const podeMexer = (c.souMestre && (p.tipo === 'monstro' ? !!segredo : true)) || minha
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

  const podeIniciativa = c.souMestre || minha
  const mudarIniciativa = (n: number | null) => {
    if (c.souMestre) acao(() => alterarParticipante(p.id, { iniciativa: n }))
    else acao(() => atualizarMeuParticipante(p.id, { iniciativa: n }))
  }

  const caido = vida ? vida.pv === 0 : false
  return (
    <li
      className={`combate__linha${naVez ? ' combate__linha--vez' : ''}${caido ? ' combate__linha--caido' : ''}`}
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
        {c.souMestre && segredo && segredo.condicoes.length > 0 && (
          <span className="combate__condicoes">
            {segredo.condicoes.map((x) => (
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
              <span className="numeros combate__pv-valor">
                {p.tipo === 'monstro' ? 'PV ' : ''}
                {vida.pv}/{vida.pv_max}
                {vida.pv_temp > 0 && <span className="suave"> +{vida.pv_temp}</span>}
              </span>
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
        {c.souMestre && (
          <span className="combate__acoes">
            {p.tipo === 'monstro' && (
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
            <button
              type="button"
              className="botao botao--fantasma botao--icone"
              onClick={() => setRemovendo(true)}
              aria-label={`Tirar ${p.nome} do combate`}
              title="Tirar do combate"
            >
              <Icone nome="fechar" />
            </button>
          </span>
        )}
      </span>

      {segredo?.monstro && (
        <Dialogo aberto={abrindo} titulo={p.nome} aoFechar={() => setAbrindo(false)}>
          <p className="suave">As rolagens daqui são secretas: só você vê.</p>
          <BlocoMonstro m={segredo.monstro} aoRolar={(expr, rotulo) => rolar(expr, { rotulo: `${p.nome} · ${rotulo}`, secreta: true })} />
        </Dialogo>
      )}
      {segredo && (
        <Dialogo aberto={condicoes} titulo={`Condições · ${p.nome}`} aoFechar={() => setCondicoes(false)}>
          <div className="combate__lista-condicoes">
            {CONDICOES.map((cd) => {
              const tem = segredo.condicoes.includes(cd.nome)
              return (
                <label key={cd.id} className="alternar">
                  <input
                    type="checkbox"
                    checked={tem}
                    disabled={travado}
                    onChange={() =>
                      acao(() =>
                        alterarSegredo(p.id, { condicoes: tem ? segredo.condicoes.filter((x) => x !== cd.nome) : [...segredo.condicoes, cd.nome] }),
                      )
                    }
                  />
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
