import { carregarScript, criarHospedeiro, type Motor } from './motores'
import type { Faixa } from './trilhas'

interface ControladorSpotify {
  loadUri(uri: string): void
  play(): void
  pause(): void
  addListener(evento: string, cb: (e: { data: { isPaused: boolean; position: number; duration: number } }) => void): void
}
interface ApiSpotify {
  createController(el: HTMLElement, o: { uri: string; width: string; height: string }, cb: (c: ControladorSpotify) => void): void
}
declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: ApiSpotify) => void
  }
}

let api: Promise<ApiSpotify> | null = null
function carregarApi(): Promise<ApiSpotify> {
  api ??= new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve
    carregarScript('https://open.spotify.com/embed/iframe-api/v1').catch((e) => {
      api = null
      reject(e)
    })
  })
  return api
}

/** `track:ID` → `spotify:track:ID`. */
const uriDa = (f: Faixa) => `spotify:${f.recurso}`

/**
 * O player embutido do Spotify não tem volume. Toca a faixa inteira se o mestre estiver logado
 * no Spotify Premium neste navegador; senão, só um trecho de 30 segundos.
 */
export function criarMotorSpotify(): Motor {
  let controlador: ControladorSpotify | null = null
  let fim: () => void = () => {}
  let avisouFim = false

  async function garantir(uri: string): Promise<ControladorSpotify> {
    if (controlador) return controlador
    const spotify = await carregarApi()
    const host = criarHospedeiro('trilhas-spotify')
    const alvo = document.createElement('div')
    host.appendChild(alvo)
    return new Promise((resolve) => {
      spotify.createController(alvo, { uri, width: '300', height: '152' }, (c) => {
        c.addListener('playback_update', (e) => {
          const { isPaused, position, duration } = e.data
          // O Spotify não avisa quando acaba: pausado no fim da duração.
          if (isPaused && duration > 0 && position >= duration - 800 && !avisouFim) {
            avisouFim = true
            fim()
          }
        })
        controlador = c
        resolve(c)
      })
    })
  }

  return {
    podeVolume: false,
    async carregar(f: Faixa) {
      avisouFim = false
      const novo = controlador === null
      const c = await garantir(uriDa(f))
      if (!novo) c.loadUri(uriDa(f))
      c.play()
    },
    tocar: () => controlador?.play(),
    pausar: () => controlador?.pause(),
    parar: () => controlador?.pause(),
    volume: () => {},
    aoTerminar(cb) {
      fim = cb
    },
  }
}
