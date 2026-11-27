import { carregarScript, criarHospedeiro, type Motor } from './motores'
import type { Faixa } from './trilhas'

interface JogadorYT {
  loadVideoById(id: string): void
  loadPlaylist(o: { list: string; listType: 'playlist' }): void
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  setVolume(v: number): void
  getVolume(): number
}
interface NomeDeEspacoYT {
  Player: new (el: HTMLElement | string, o: object) => JogadorYT
}
declare global {
  interface Window {
    YT?: NomeDeEspacoYT
    onYouTubeIframeAPIReady?: () => void
  }
}

let api: Promise<NomeDeEspacoYT> | null = null
function carregarApi(): Promise<NomeDeEspacoYT> {
  api ??= new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT)
    const anterior = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      anterior?.()
      resolve(window.YT!)
    }
    carregarScript('https://www.youtube.com/iframe_api').catch((e) => {
      api = null
      reject(e)
    })
  })
  return api
}

const ESPERA = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function criarMotorYoutube(): Motor {
  let jogador: JogadorYT | null = null
  let fim: () => void = () => {}
  let volume = 80

  async function garantir(): Promise<JogadorYT> {
    if (jogador) return jogador
    const YT = await carregarApi()
    const host = criarHospedeiro('trilhas-youtube')
    const alvo = document.createElement('div')
    host.appendChild(alvo)
    return new Promise((resolve) => {
      const j: JogadorYT = new YT.Player(alvo, {
        width: '200',
        height: '200',
        playerVars: { playsinline: 1, controls: 0, rel: 0 },
        events: {
          onReady: () => {
            jogador = j
            j.setVolume(volume)
            resolve(j)
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 0) fim() // 0 = ENDED
          },
        },
      })
    })
  }

  return {
    podeVolume: true,
    async carregar(f: Faixa) {
      const j = await garantir()
      j.setVolume(volume)
      if (f.recurso.startsWith('playlist:')) j.loadPlaylist({ list: f.recurso.slice('playlist:'.length), listType: 'playlist' })
      else j.loadVideoById(f.recurso)
    },
    tocar: () => jogador?.playVideo(),
    pausar: () => jogador?.pauseVideo(),
    async parar() {
      const j = jogador
      if (!j) return
      // Baixa o volume aos poucos para a música não cortar seca.
      for (let v = volume; v > 0; v -= Math.max(5, Math.round(volume / 8))) {
        j.setVolume(v)
        await ESPERA(100)
      }
      j.stopVideo()
      j.setVolume(volume)
    },
    volume(v: number) {
      volume = v
      jogador?.setVolume(v)
    },
    aoTerminar(cb) {
      fim = cb
    },
  }
}
