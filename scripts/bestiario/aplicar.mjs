// Junta as traduções novas de fonte/novas-NN.json ao mapa (frases.json) e grava o lote no app.
// Uso: node scripts/bestiario/aplicar.mjs 01
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gravarMapa, lerMapa } from './frases.mjs'
import { carregarLote, traduzirMonstro } from './pendentes.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const nn = process.argv[2]
const mapa = lerMapa()
const novas = join(AQUI, 'fonte', `novas-${nn}.json`)
if (existsSync(novas)) {
  for (const [k, v] of Object.entries(JSON.parse(readFileSync(novas, 'utf8')))) {
    const usados = (k.match(/\{\d+\}/g) ?? []).sort().join()
    const tem = (v.match(/\{\d+\}/g) ?? [])
      .filter((x, i, a) => a.indexOf(x) === i)
      .sort()
      .join()
    if (v && usados !== tem) console.log(`  marcadores diferentes: ${k.slice(0, 70)}`)
    if (v) mapa[k] = v
  }
  gravarMapa(mapa)
}
const falta = new Set()
const lote = carregarLote(nn).map((m) => {
  const r = traduzirMonstro(m, mapa)
  r.faltando.forEach((f) => falta.add(f))
  return r.monstro
})
writeFileSync(join(AQUI, '..', '..', 'src/regras/dnd5e/dados/monstros/srd', `lote-${nn}.json`), JSON.stringify(lote, null, 1) + '\n')
console.log(`lote ${nn}: ${lote.length} monstros, ${falta.size} frases sem tradução, mapa com ${Object.keys(mapa).length}`)
for (const f of falta) console.log('  falta: ' + f.slice(0, 100))
