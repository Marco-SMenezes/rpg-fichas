import { useSyncExternalStore } from 'react'
import { motorDe, type Motor } from './motores'
import type { Cena, Faixa, Servico } from './trilhas'

export interface EstadoDoPlayer {
  campanhaId: string | null
  /** Cópia da cena no momento em que começou; editar a lista não muda o que está tocando. */
  cena: Cena | null
  indice: number
  tocando: boolean
  repetir: boolean
  /** 0 a 100 (só o YouTube obedece). */
  volume: number
  erro: string
}

const INICIAL: EstadoDoPlayer = { campanhaId: null, cena: null, indice: 0, tocando: false, repetir: false, volume: 80, erro: '' }

let estado: EstadoDoPlayer = INICIAL
const ouvintes = new Set<() => void>()
let fabrica: (s: Servico) => Motor | null = motorDe
let ativo: Motor | null = null
/** Cada carregamento tem um número; resposta atrasada de uma faixa antiga é ignorada. */
let geracao = 0

function mudar(parcial: Partial<EstadoDoPlayer>) {
  estado = { ...estado, ...parcial }
  ouvintes.forEach((o) => o())
}

export function usarPlayer(): EstadoDoPlayer {
  return useSyncExternalStore(
    (o) => {
      ouvintes.add(o)
      return () => ouvintes.delete(o)
    },
    () => estado,
  )
}

export const faixaAtual = (e: EstadoDoPlayer = estado): Faixa | null => e.cena?.faixas[e.indice] ?? null

/** Só para teste: troca os players de terceiros por falsos e zera o estado. */
export function reiniciarPlayer(f?: (s: Servico) => Motor | null) {
  fabrica = f ?? motorDe
  ativo = null
  geracao++
  estado = INICIAL
  ouvintes.forEach((o) => o())
}

async function carregarAtual() {
  const minha = ++geracao
  const f = faixaAtual()
  if (!f) return void pararTudo()
  const motor = fabrica(f.servico)
  if (!motor) return void avancar() // link simples: não toca aqui, pula
  if (ativo && ativo !== motor) void ativo.parar()
  ativo = motor
  motor.aoTerminar(() => {
    if (minha === geracao) avancar()
  })
  try {
    mudar({ tocando: true, erro: '' })
    motor.volume(estado.volume)
    await motor.carregar(f)
    if (minha !== geracao) return
    motor.tocar()
  } catch (e) {
    if (minha === geracao) mudar({ tocando: false, erro: e instanceof Error ? e.message : 'Não deu para tocar esta faixa.' })
  }
}

function avancar() {
  const cena = estado.cena
  if (!cena) return
  const proximo = estado.indice + 1
  if (proximo < cena.faixas.length) {
    mudar({ indice: proximo })
    void carregarAtual()
  } else if (estado.repetir && cena.faixas.some((x) => x.servico !== 'link')) {
    mudar({ indice: 0 })
    void carregarAtual()
  } else {
    pararTudo()
  }
}

/** Começa uma cena (opcionalmente numa faixa específica). */
export function tocarCena(campanhaId: string, cena: Cena, indice = 0) {
  mudar({ campanhaId, cena: { ...cena, faixas: cena.faixas.map((f) => ({ ...f })) }, indice, erro: '' })
  void carregarAtual()
}

export function alternar() {
  if (!faixaAtual() || !ativo) return
  if (estado.tocando) {
    ativo.pausar()
    mudar({ tocando: false })
  } else {
    ativo.tocar()
    mudar({ tocando: true })
  }
}

export function proxima() {
  avancar()
}

export function anterior() {
  if (!estado.cena || estado.indice === 0) return
  mudar({ indice: estado.indice - 1 })
  void carregarAtual()
}

export function pararTudo() {
  geracao++
  const motor = ativo
  ativo = null
  void motor?.parar()
  estado = { ...estado, campanhaId: null, cena: null, indice: 0, tocando: false, erro: '' }
  ouvintes.forEach((o) => o())
}

export function definirVolume(v: number) {
  mudar({ volume: v })
  ativo?.volume(v)
}

export function alternarRepetir() {
  mudar({ repetir: !estado.repetir })
}

/** A cena ou a faixa que está tocando foi apagada da lista: o player para. */
export function avisarRemocao(cenaId: string, faixaId?: string) {
  if (estado.cena?.id !== cenaId) return
  if (faixaId && faixaAtual()?.id !== faixaId) return
  pararTudo()
}
