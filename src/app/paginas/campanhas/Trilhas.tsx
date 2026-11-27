import { useRef, useState } from 'react'
import { lerTrilhas, salvarTrilhas, type MinhaCampanha } from '../../../nuvem/campanhas'
import { avisarRemocao, faixaAtual, tocarCena, usarPlayer } from '../../../trilhas/estado'
import {
  LIMITE_DAS_TRILHAS,
  moverItem,
  novaCena,
  novaFaixa,
  reconhecerLink,
  tamanhoDasTrilhas,
  type Cena,
  type Faixa,
  type Servico,
  type Trilhas as ListaDeTrilhas,
} from '../../../trilhas/trilhas'
import { Icone } from '../../componentes/Icone'
import { useCarga } from './usarCarga'

const NOME_SERVICO: Record<Servico, string> = { youtube: 'YouTube', spotify: 'Spotify', link: 'Link' }

/** Trilhas sonoras do mestre: cenas com faixas do YouTube e do Spotify. Quem toca é a barra do player, que vale em todo o app. */
export function Trilhas({ c }: { c: MinhaCampanha }) {
  const carga = useCarga(() => lerTrilhas(c.id), [c.id])
  return (
    <div className="trilhas">
      <section className="bloco" aria-labelledby="t-trilhas">
        <h2 id="t-trilhas">Trilhas sonoras</h2>
        <p className="campo__ajuda">
          Só você vê esta lista, e a música toca só neste aparelho. Cole links do YouTube (vídeo ou playlist) e do Spotify. A barra do player continua
          tocando em qualquer tela do Tomo, mas para se você recarregar a página ou fechar o navegador. Com o Spotify Premium logado neste navegador,
          a faixa toca inteira; sem ele, só 30 segundos.
        </p>
      </section>
      {carga.dados ? <Cenas c={c} inicial={carga.dados} /> : <p className="suave">{carga.erro || 'Carregando…'}</p>}
    </div>
  )
}

function Cenas({ c, inicial }: { c: MinhaCampanha; inicial: ListaDeTrilhas }) {
  const [trilhas, setTrilhas] = useState(inicial)
  const [estado, setEstado] = useState('')
  const [nomeNovo, setNomeNovo] = useState('')

  // Uma gravação por vez, sempre da lista mais nova (como no escudo).
  const fila = useRef<{ gravando: boolean; proxima: ListaDeTrilhas | null }>({ gravando: false, proxima: null })
  const gravar = async () => {
    const f = fila.current
    if (f.gravando) return
    f.gravando = true
    let erro = ''
    while (f.proxima) {
      const l = f.proxima
      f.proxima = null
      try {
        await salvarTrilhas(c.id, l)
        erro = ''
      } catch (e) {
        erro = e instanceof Error ? e.message : 'Não foi possível salvar.'
      }
    }
    f.gravando = false
    setEstado(erro || 'Salvo.')
  }
  const salvar = (novo: ListaDeTrilhas) => {
    if (tamanhoDasTrilhas(novo) > LIMITE_DAS_TRILHAS) {
      setEstado('As trilhas passaram do limite. Apague alguma faixa ou cena.')
      return false
    }
    setTrilhas(novo)
    setEstado('Salvando…')
    fila.current.proxima = novo
    void gravar()
    return true
  }
  const trocarCena = (id: string, f: (c: Cena) => Cena) => salvar({ cenas: trilhas.cenas.map((x) => (x.id === id ? f(x) : x)) })

  return (
    <>
      <section className="bloco" aria-labelledby="t-cenas">
        <h2 id="t-cenas">Cenas</h2>
        <form
          className="trilhas__nova"
          onSubmit={(e) => {
            e.preventDefault()
            if (salvar({ cenas: [...trilhas.cenas, novaCena(nomeNovo)] })) setNomeNovo('')
          }}
        >
          <label className="campo">
            <span className="rotulo">Nome da nova cena</span>
            <input value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} placeholder="Taverna, Floresta, Combate…" autoComplete="off" />
          </label>
          <button type="submit" className="botao botao--primario">
            <Icone nome="mais" />
            Criar cena
          </button>
        </form>
        {estado && (
          <p className="campo__ajuda" aria-live="polite">
            {estado}
          </p>
        )}
        {trilhas.cenas.length === 0 && <p className="suave">Nenhuma cena ainda. Crie uma e cole os links das músicas dentro dela.</p>}
      </section>

      {trilhas.cenas.map((cena, i) => (
        <CartaoDeCena
          key={cena.id}
          campanhaId={c.id}
          cena={cena}
          primeira={i === 0}
          ultima={i === trilhas.cenas.length - 1}
          aoMudar={(f) => trocarCena(cena.id, f)}
          aoMover={(delta) => salvar({ cenas: moverItem(trilhas.cenas, i, i + delta) })}
          aoApagar={() => {
            avisarRemocao(cena.id)
            salvar({ cenas: trilhas.cenas.filter((x) => x.id !== cena.id) })
          }}
        />
      ))}
    </>
  )
}

function CartaoDeCena({
  campanhaId,
  cena,
  primeira,
  ultima,
  aoMudar,
  aoMover,
  aoApagar,
}: {
  campanhaId: string
  cena: Cena
  primeira: boolean
  ultima: boolean
  aoMudar: (f: (c: Cena) => Cena) => boolean
  aoMover: (delta: number) => void
  aoApagar: () => void
}) {
  const player = usarPlayer()
  const [nome, setNome] = useState(cena.nome)
  const [url, setUrl] = useState('')
  const [nomeFaixa, setNomeFaixa] = useState('')
  const [erro, setErro] = useState('')
  const [apagando, setApagando] = useState(false)
  const tocandoAqui = player.cena?.id === cena.id
  const atual = tocandoAqui ? faixaAtual(player) : null

  const adicionar = () => {
    const texto = url.trim()
    if (!texto) return setErro('Cole o link da música.')
    if (reconhecerLink(texto).servico === 'link' && !/^https?:\/\//i.test(texto)) return setErro('Cole um link que comece com https://.')
    if (aoMudar((x) => ({ ...x, faixas: [...x.faixas, novaFaixa(texto, nomeFaixa)] }))) {
      setUrl('')
      setNomeFaixa('')
      setErro('')
    }
  }

  return (
    <section className="bloco trilhas__cena" aria-label={`Cena ${cena.nome}`}>
      <div className="trilhas__cabeca">
        <input
          className="trilhas__nome"
          value={nome}
          aria-label={`Nome da cena ${cena.nome}`}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => nome.trim() !== cena.nome && aoMudar((x) => ({ ...x, nome: nome.trim() || 'Cena' }))}
        />
        <div className="trilhas__acoes">
          <button
            type="button"
            className="botao botao--primario"
            disabled={!cena.faixas.some((f) => f.servico !== 'link')}
            onClick={() =>
              tocarCena(
                campanhaId,
                cena,
                Math.max(
                  0,
                  cena.faixas.findIndex((f) => f.servico !== 'link'),
                ),
              )
            }
          >
            <Icone nome="tocar" preenchido />
            Tocar cena
          </button>
          <button
            type="button"
            className="botao botao--fantasma botao--icone"
            disabled={primeira}
            onClick={() => aoMover(-1)}
            aria-label={`Subir cena ${cena.nome}`}
            title="Subir"
          >
            <Icone nome="subir" />
          </button>
          <button
            type="button"
            className="botao botao--fantasma botao--icone"
            disabled={ultima}
            onClick={() => aoMover(1)}
            aria-label={`Descer cena ${cena.nome}`}
            title="Descer"
          >
            <Icone nome="baixar" />
          </button>
          {apagando ? (
            <button type="button" className="botao botao--perigo" onClick={aoApagar} onBlur={() => setApagando(false)} autoFocus>
              Apagar mesmo?
            </button>
          ) : (
            <button
              type="button"
              className="botao botao--fantasma botao--icone"
              onClick={() => setApagando(true)}
              aria-label={`Apagar cena ${cena.nome}`}
              title="Apagar"
            >
              <Icone nome="lixo" />
            </button>
          )}
        </div>
      </div>

      {cena.faixas.length === 0 ? (
        <p className="suave">Sem faixas. Cole um link abaixo.</p>
      ) : (
        <ol className="trilhas__faixas">
          {cena.faixas.map((f, i) => (
            <LinhaDaFaixa
              key={f.id}
              faixa={f}
              tocando={atual?.id === f.id && player.tocando}
              atual={atual?.id === f.id}
              primeira={i === 0}
              ultima={i === cena.faixas.length - 1}
              aoTocar={() => tocarCena(campanhaId, cena, i)}
              aoMover={(delta) => aoMudar((x) => ({ ...x, faixas: moverItem(x.faixas, i, i + delta) }))}
              aoApagar={() => {
                avisarRemocao(cena.id, f.id)
                aoMudar((x) => ({ ...x, faixas: x.faixas.filter((y) => y.id !== f.id) }))
              }}
            />
          ))}
        </ol>
      )}

      <form
        className="trilhas__adicionar"
        onSubmit={(e) => {
          e.preventDefault()
          adicionar()
        }}
      >
        <label className="campo">
          <span className="rotulo">Link da música</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtu.be/… ou https://open.spotify.com/…"
            autoComplete="off"
            inputMode="url"
            aria-label={`Link da música na cena ${cena.nome}`}
          />
        </label>
        <label className="campo">
          <span className="rotulo">Nome (opcional)</span>
          <input
            value={nomeFaixa}
            onChange={(e) => setNomeFaixa(e.target.value)}
            placeholder="Taverna animada"
            autoComplete="off"
            aria-label={`Nome da faixa na cena ${cena.nome}`}
          />
        </label>
        <button type="submit" className="botao" aria-label={`Adicionar faixa na cena ${cena.nome}`}>
          <Icone nome="mais" />
          Adicionar faixa
        </button>
        <p className="aviso-campo" role="alert">
          {erro}
        </p>
      </form>
    </section>
  )
}

function LinhaDaFaixa({
  faixa,
  tocando,
  atual,
  primeira,
  ultima,
  aoTocar,
  aoMover,
  aoApagar,
}: {
  faixa: Faixa
  tocando: boolean
  atual: boolean
  primeira: boolean
  ultima: boolean
  aoTocar: () => void
  aoMover: (delta: number) => void
  aoApagar: () => void
}) {
  return (
    <li className={`trilhas__faixa${atual ? ' trilhas__faixa--atual' : ''}`}>
      {faixa.servico === 'link' ? (
        <a
          className="botao botao--fantasma"
          href={faixa.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${faixa.nome} em outra aba`}
        >
          Abrir
        </a>
      ) : (
        <button
          type="button"
          className="botao botao--icone"
          onClick={aoTocar}
          aria-label={`Tocar ${faixa.nome}`}
          aria-pressed={tocando}
          title="Tocar"
        >
          <Icone nome="tocar" preenchido />
        </button>
      )}
      <span className="trilhas__faixa-nome">
        {faixa.nome} <span className="etiqueta">{NOME_SERVICO[faixa.servico]}</span>
      </span>
      <button
        type="button"
        className="botao botao--fantasma botao--icone"
        disabled={primeira}
        onClick={() => aoMover(-1)}
        aria-label={`Subir ${faixa.nome}`}
        title="Subir"
      >
        <Icone nome="subir" />
      </button>
      <button
        type="button"
        className="botao botao--fantasma botao--icone"
        disabled={ultima}
        onClick={() => aoMover(1)}
        aria-label={`Descer ${faixa.nome}`}
        title="Descer"
      >
        <Icone nome="baixar" />
      </button>
      <button type="button" className="botao botao--fantasma botao--icone" onClick={aoApagar} aria-label={`Apagar ${faixa.nome}`} title="Apagar">
        <Icone nome="lixo" />
      </button>
    </li>
  )
}
