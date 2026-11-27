import { useEffect } from 'react'
import { Icone } from '../app/componentes/Icone'
import { caminho } from '../app/rotas'
import { alternar, alternarRepetir, anterior, definirVolume, faixaAtual, pararTudo, proxima, usarPlayer } from './estado'

/** A barra do player: aparece enquanto há música, em qualquer tela do app. Quem toca de verdade são os players escondidos do YouTube e do Spotify. */
export function PlayerDeTrilhas() {
  const p = usarPlayer()
  const f = faixaAtual(p)

  // Dá espaço no fim das páginas para a barra não cobrir o conteúdo.
  useEffect(() => {
    document.documentElement.classList.toggle('com-trilhas', f !== null)
    return () => document.documentElement.classList.remove('com-trilhas')
  }, [f])

  if (!f || !p.cena || !p.campanhaId) return null
  const total = p.cena.faixas.length
  return (
    <aside className="player" aria-label="Trilha sonora">
      <div className="player__titulo">
        <span className="player__faixa">{f.nome}</span>
        <a className="player__cena" href={caminho.campanha(p.campanhaId, 'trilhas')}>
          {p.cena.nome} · {p.indice + 1}/{total}
        </a>
        {p.erro && (
          <span className="player__erro" role="alert">
            {p.erro}
          </span>
        )}
      </div>
      <div className="player__controles">
        <button
          type="button"
          className="botao botao--fantasma botao--icone"
          onClick={anterior}
          disabled={p.indice === 0}
          aria-label="Faixa anterior"
          title="Anterior"
        >
          <Icone nome="anterior" preenchido />
        </button>
        <button
          type="button"
          className="botao botao--primario botao--icone"
          onClick={alternar}
          aria-label={p.tocando ? 'Pausar' : 'Tocar'}
          title={p.tocando ? 'Pausar' : 'Tocar'}
        >
          <Icone nome={p.tocando ? 'pausar' : 'tocar'} preenchido={!p.tocando} />
        </button>
        <button type="button" className="botao botao--fantasma botao--icone" onClick={proxima} aria-label="Próxima faixa" title="Próxima">
          <Icone nome="proxima" preenchido />
        </button>
        <button
          type="button"
          className="botao botao--fantasma botao--icone"
          aria-pressed={p.repetir}
          onClick={alternarRepetir}
          aria-label="Repetir a cena"
          title="Repetir a cena"
        >
          <Icone nome="repetir" />
        </button>
        {f.servico === 'youtube' && (
          <label className="player__volume">
            <span className="sr-only">Volume</span>
            <input type="range" min={0} max={100} value={p.volume} onChange={(e) => definirVolume(Number(e.target.value))} />
          </label>
        )}
        <button type="button" className="botao botao--fantasma botao--icone" onClick={pararTudo} aria-label="Parar a música" title="Parar">
          <Icone nome="parar" preenchido />
        </button>
      </div>
    </aside>
  )
}
