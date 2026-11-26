// Moldes de frase de um lote que ainda faltam em frases.json.
// Uso: node scripts/bestiario/pendentes.mjs 01   → imprime { "molde": "" }
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lerMapa, molde, traduzir } from './frases.mjs'
import { NOMES_PT, pretraduzir } from './glossario.mjs'

const FONTE = join(dirname(fileURLToPath(import.meta.url)), 'fonte')
export const CAMPOS_LIVRES = ['nome', 'caDescricao', 'descricaoLendaria', 'idiomas', 'subtipo', 'deslocamento', 'sentidos']
export const LISTAS = ['tracos', 'acoes', 'acoesBonus', 'reacoes', 'lendarias']

export function carregarLote(nn) {
  const srd = Object.fromEntries(JSON.parse(readFileSync(join(FONTE, 'srd.json'), 'utf8')).map((s) => [`srd-${s.slug}`, s]))
  return JSON.parse(readFileSync(join(FONTE, `esqueleto-${nn}.json`), 'utf8')).map((e) => pretraduzir(e, srd[e.id].speed))
}

/** Traduz o monstro inteiro com o mapa. O nome sempre passa pelo mapa (mesmo sem palavra inglesa). */
export function traduzirMonstro(m, mapa) {
  const faltando = []
  const t = (s, sempre = false) => {
    if (sempre && s && !mapa[s]) {
      faltando.push(s)
      return s
    }
    if (sempre) return mapa[s]
    const r = traduzir(s, mapa)
    faltando.push(...r.faltando)
    return r.texto
  }
  /** Nome de traço/ação: sempre pelo mapa (com números em molde), salvo se o glossário já traduziu. */
  const nomeDeTexto = (n) => {
    if (NOMES_PT.has(n)) return n
    const { chave, nums } = molde(n)
    if (!mapa[chave]) {
      faltando.push(chave)
      return n
    }
    return mapa[chave].replace(/\{(\d+)\}/g, (_, i) => nums[Number(i)])
  }
  const x = { ...m }
  x.nome = t(m.nome, true)
  for (const k of CAMPOS_LIVRES.slice(1)) x[k] = t(m[k])
  for (const k of LISTAS) x[k] = m[k].map((y) => ({ nome: nomeDeTexto(y.nome), texto: t(y.texto) }))
  return { monstro: x, faltando }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mapa = lerMapa()
  const pend = new Set()
  for (const m of carregarLote(process.argv[2])) for (const f of traduzirMonstro(m, mapa).faltando) pend.add(f)
  console.log(JSON.stringify(Object.fromEntries([...pend].map((t) => [t, ''])), null, 1))
}
