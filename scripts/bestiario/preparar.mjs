// Baixa os monstros do SRD 5.1 (Open5e, documento wotc-srd) e gera esqueletos no formato
// do Tomo, com os números já preenchidos. A tradução só troca os textos.
// Uso: node scripts/bestiario/preparar.mjs  →  scripts/bestiario/fonte/ (fora do git)
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const FONTE = join(dirname(fileURLToPath(import.meta.url)), 'fonte')
const URL_SRD = 'https://api.open5e.com/v1/monsters/?document__slug=wotc-srd&limit=500'
const POR_LOTE = 19

const XP = {
  0: 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  1: 200,
  2: 450,
  3: 700,
  4: 1100,
  5: 1800,
  6: 2300,
  7: 2900,
  8: 3900,
  9: 5000,
  10: 5900,
  11: 7200,
  12: 8400,
  13: 10000,
  14: 11500,
  15: 13000,
  16: 15000,
  17: 18000,
  18: 20000,
  19: 22000,
  20: 25000,
  21: 33000,
  22: 41000,
  23: 50000,
  24: 62000,
  25: 75000,
  26: 90000,
  27: 105000,
  28: 120000,
  29: 135000,
  30: 155000,
}
const ATR = [
  ['for', 'strength'],
  ['des', 'dexterity'],
  ['con', 'constitution'],
  ['int', 'intelligence'],
  ['sab', 'wisdom'],
  ['car', 'charisma'],
]
const textos = (l) => (l ?? []).map((t) => ({ nome: t.name, texto: t.desc }))

function esqueleto(s) {
  const salvaguardas = {}
  for (const [a, en] of ATR) if (typeof s[`${en}_save`] === 'number') salvaguardas[a] = s[`${en}_save`]
  return {
    id: `srd-${s.slug}`,
    nome: s.name,
    nomeOriginal: s.name,
    tamanho: s.size,
    tipo: s.type,
    subtipo: s.subtype ?? '',
    tendencia: s.alignment ?? '',
    ca: s.armor_class,
    caDescricao: s.armor_desc ?? '',
    pv: s.hit_points,
    dadosDeVida: s.hit_dice ?? '',
    deslocamento: Object.entries(s.speed ?? {})
      .map(([k, v]) => `${k} ${v}`)
      .join(', '),
    atributos: Object.fromEntries(ATR.map(([a, en]) => [a, s[en]])),
    salvaguardas,
    pericias: Object.entries(s.skills ?? {}).map(([nome, bonus]) => ({
      nome,
      bonus,
    })),
    vulnerabilidades: s.damage_vulnerabilities ?? '',
    resistencias: s.damage_resistances ?? '',
    imunidades: s.damage_immunities ?? '',
    imunidadesACondicao: s.condition_immunities ?? '',
    sentidos: s.senses ?? '',
    idiomas: s.languages ?? '',
    nd: s.challenge_rating,
    xp: XP[s.challenge_rating] ?? 0,
    tracos: textos(s.special_abilities),
    acoes: textos(s.actions),
    acoesBonus: textos(s.bonus_actions),
    reacoes: textos(s.reactions),
    lendarias: textos(s.legendary_actions),
    descricaoLendaria: s.legendary_desc ?? '',
    origem: 'srd',
  }
}

const resposta = await fetch(URL_SRD)
if (!resposta.ok) throw new Error(`Open5e respondeu ${resposta.status}`)
const { results } = await resposta.json()
results.sort((a, b) => a.slug.localeCompare(b.slug))
mkdirSync(FONTE, { recursive: true })
writeFileSync(join(FONTE, 'srd.json'), JSON.stringify(results, null, 1))
const lotes = Math.ceil(results.length / POR_LOTE)
for (let i = 0; i < lotes; i++) {
  const nn = String(i + 1).padStart(2, '0')
  writeFileSync(join(FONTE, `esqueleto-${nn}.json`), JSON.stringify(results.slice(i * POR_LOTE, (i + 1) * POR_LOTE).map(esqueleto), null, 1))
}
console.log(`${results.length} monstros, ${lotes} lotes`)
