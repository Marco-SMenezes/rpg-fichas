// Tradução por frase com moldes: os números viram {0}, {1}… e a mesma frase serve para
// todos os monstros (ex.: a Presença Aterradora de cada dragão). O mapa fica em frases.json.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ARQUIVO = join(dirname(fileURLToPath(import.meta.url)), 'frases.json')
export const INGLES = new RegExp(
  '(?<!\\p{L})(' +
    "the|of|and|or|to|its|it|is|are|with|that|this|on|if|can|can't|creature|creatures|target|damage|feet|turn|each|while|which|be|has|have|must|takes?|attack|attacks|an|you|from|for|by|at|as|into|up|out|any|one|two|three|until|when|instead|level|slots?|will|day|spells?|hit|points|action|bonus|reaction|speed|half|through|over|against|within|without|after|before|other|another|only|also|more|than|then|there|their|they|them|was|were|not|all|every|but|so|cantrips|prepared|uses|makes|has|gains?" +
    ')(?!\\p{L})',
  'iu',
)

const NUMERO = /\d+d\d+|\d+(?:,\d+)?/g

export function lerMapa() {
  return existsSync(ARQUIVO) ? JSON.parse(readFileSync(ARQUIVO, 'utf8')) : {}
}
export function gravarMapa(mapa) {
  const ordenado = Object.fromEntries(Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(ARQUIVO, JSON.stringify(ordenado, null, 1) + '\n')
}

/** Separa em linhas e frases, guardando os separadores para remontar igual. */
export function partir(texto) {
  return texto.split(/(\n+|(?<=[.!?])\s+(?=[A-Z*_(]))/)
}

export function molde(frase) {
  const nums = frase.match(NUMERO) ?? []
  let i = 0
  return { chave: frase.replace(NUMERO, () => `{${i++}}`), nums }
}

export const precisa = (frase) => INGLES.test(frase)

/** Traduz um texto inteiro; devolve também os moldes que faltam no mapa. */
export function traduzir(texto, mapa) {
  if (!texto) return { texto, faltando: [] }
  const faltando = []
  const partes = partir(texto).map((p, i) => {
    if (i % 2 === 1 || !p.trim() || !precisa(p)) return p
    const { chave, nums } = molde(p)
    const pt = mapa[chave]
    if (!pt) {
      faltando.push(chave)
      return p
    }
    return pt.replace(/\{(\d+)\}/g, (_, n) => nums[Number(n)] ?? `{${n}}`)
  })
  return { texto: partes.join(''), faltando }
}
