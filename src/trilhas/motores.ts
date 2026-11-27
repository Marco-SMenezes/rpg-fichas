import type { Faixa, Servico } from './trilhas'
import { criarMotorSpotify } from './spotify'
import { criarMotorYoutube } from './youtube'

/** Um player de terceiros (YouTube, Spotify) escondido atrás de uma interface só. */
export interface Motor {
  /** Carrega a faixa e já começa a tocar. */
  carregar(f: Faixa): Promise<void>
  tocar(): void
  pausar(): void
  /** Para de vez (o YouTube baixa o volume aos poucos antes). */
  parar(): Promise<void> | void
  /** De 0 a 100. Só vale quando `podeVolume`. */
  volume(v: number): void
  /** Chamado quando a faixa (ou a playlist) acaba sozinha. */
  aoTerminar(cb: () => void): void
  podeVolume: boolean
}

const motores: Partial<Record<Servico, Motor>> = {}

/** O motor do serviço (criado na primeira vez que alguém toca), ou null para links simples. */
export function motorDe(servico: Servico): Motor | null {
  if (servico === 'link') return null
  motores[servico] ??= servico === 'youtube' ? criarMotorYoutube() : criarMotorSpotify()
  return motores[servico]!
}

/** Carrega um script de terceiros uma vez só. */
export function carregarScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existente) {
      existente.addEventListener('load', () => resolve())
      if (existente.dataset.pronto === '1') resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => {
      s.dataset.pronto = '1'
      resolve()
    }
    s.onerror = () => reject(new Error('Não deu para carregar o player. Confira a internet.'))
    document.head.appendChild(s)
  })
}

/** Elemento onde o player de terceiros nasce. Fica fora da tela (a barra do Tomo é o controle). */
export function criarHospedeiro(id: string): HTMLElement {
  const antigo = document.getElementById(id)
  if (antigo) return antigo
  const el = document.createElement('div')
  el.id = id
  el.className = 'trilhas__motor'
  document.body.appendChild(el)
  return el
}
