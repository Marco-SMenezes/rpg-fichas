import { beforeEach, describe, expect, it } from 'vitest'
import {
  alternar,
  anterior,
  avisarRemocao,
  definirVolume,
  faixaAtual,
  pararTudo,
  proxima,
  reiniciarPlayer,
  tocarCena,
  alternarRepetir,
} from './estado'
import type { Motor } from './motores'
import { novaCena, novaFaixa, type Cena } from './trilhas'

function motorFalso(nome: string, log: string[]): Motor & { terminar: () => void } {
  let fim = () => {}
  return {
    podeVolume: true,
    carregar: async (f) => void log.push(`${nome}:carregar:${f.nome}`),
    tocar: () => void log.push(`${nome}:tocar`),
    pausar: () => void log.push(`${nome}:pausar`),
    parar: () => void log.push(`${nome}:parar`),
    volume: (v) => void log.push(`${nome}:volume:${v}`),
    aoTerminar: (cb) => (fim = cb),
    terminar: () => fim(),
  }
}

const espera = () => new Promise((r) => setTimeout(r, 0))

let log: string[]
let yt: ReturnType<typeof motorFalso>
let sp: ReturnType<typeof motorFalso>
const cena = (): Cena => ({
  ...novaCena('Taverna'),
  faixas: [
    novaFaixa('https://youtu.be/AAAAAAAAAAA', 'um'),
    novaFaixa('https://open.spotify.com/track/BBB', 'dois'),
    novaFaixa('https://exemplo.com/x', 'link'),
  ],
})

beforeEach(() => {
  log = []
  yt = motorFalso('yt', log)
  sp = motorFalso('sp', log)
  reiniciarPlayer((s) => (s === 'youtube' ? yt : s === 'spotify' ? sp : null))
})

describe('player de trilhas', () => {
  it('toca a primeira faixa e usa o motor do serviço dela', async () => {
    tocarCena('camp', cena())
    await espera()
    expect(log).toContain('yt:carregar:um')
    expect(faixaAtual()?.nome).toBe('um')
  })

  it('ao terminar, vai para a próxima; trocar de serviço para o motor anterior', async () => {
    tocarCena('camp', cena())
    await espera()
    yt.terminar()
    await espera()
    expect(log).toContain('sp:carregar:dois')
    expect(log).toContain('yt:parar')
  })

  it('no fim da cena, para; com repetir, volta ao começo (links simples são pulados)', async () => {
    tocarCena('camp', cena(), 1)
    await espera()
    sp.terminar()
    await espera()
    expect(faixaAtual()).toBeNull() // a última faixa é um link: não toca, a cena acaba
    alternarRepetir()
    tocarCena('camp', cena(), 1)
    await espera()
    sp.terminar()
    await espera()
    expect(faixaAtual()?.nome).toBe('um')
    alternarRepetir()
  })

  it('anterior no começo não faz nada; pausar e voltar a tocar chamam o motor', async () => {
    tocarCena('camp', cena())
    await espera()
    anterior()
    expect(faixaAtual()?.nome).toBe('um')
    alternar()
    expect(log).toContain('yt:pausar')
    alternar()
    expect(log.filter((l) => l === 'yt:tocar').length).toBeGreaterThanOrEqual(2)
  })

  it('apagar a faixa que toca para o player; apagar outra faixa não', async () => {
    const c = cena()
    tocarCena('camp', c)
    await espera()
    avisarRemocao(c.id, c.faixas[1]!.id)
    expect(faixaAtual()?.nome).toBe('um')
    avisarRemocao(c.id, c.faixas[0]!.id)
    expect(faixaAtual()).toBeNull()
    expect(log).toContain('yt:parar')
  })

  it('apagar a cena inteira para; cena de outra campanha não é afetada', async () => {
    const c = cena()
    tocarCena('camp', c)
    await espera()
    avisarRemocao('outra-cena')
    expect(faixaAtual()).not.toBeNull()
    avisarRemocao(c.id)
    expect(faixaAtual()).toBeNull()
  })

  it('editar a lista original não muda o que está tocando', async () => {
    const c = cena()
    tocarCena('camp', c)
    await espera()
    c.faixas.length = 0
    expect(faixaAtual()?.nome).toBe('um')
    pararTudo()
  })

  it('o volume vai para o motor', async () => {
    tocarCena('camp', cena())
    await espera()
    definirVolume(35)
    expect(log).toContain('yt:volume:35')
    proxima()
  })
})
