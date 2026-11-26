// Lista os textos de um lote que ainda precisam de tradução manual (depois do glossário).
// Uso: node scripts/bestiario/pendentes.mjs 01 > fonte/pendentes-01.json
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pretraduzir } from "./glossario.mjs";

const FONTE = join(dirname(fileURLToPath(import.meta.url)), "fonte");
export const INGLES =
  /\b(the|a|an|of|and|or|to|its|it|is|are|with|that|this|on|in|if|can|can't|creature|target|damage|feet|turn|each|while|which|be|has|have|must|takes?|attack)\b/i;

export function carregarLote(nn) {
  const srd = Object.fromEntries(
    JSON.parse(readFileSync(join(FONTE, "srd.json"), "utf8")).map((s) => [
      `srd-${s.slug}`,
      s,
    ]),
  );
  return JSON.parse(
    readFileSync(join(FONTE, `esqueleto-${nn}.json`), "utf8"),
  ).map((e) => pretraduzir(e, srd[e.id].speed));
}

/** Todos os textos livres do monstro já pré-traduzido. */
export function textosLivres(m) {
  const r = [
    m.nome,
    m.caDescricao,
    m.descricaoLendaria,
    m.idiomas,
    m.subtipo,
    m.deslocamento,
  ];
  for (const k of ["tracos", "acoes", "acoesBonus", "reacoes", "lendarias"])
    for (const t of m[k]) r.push(t.nome, t.texto);
  return r.filter(Boolean);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const nn = process.argv[2];
  const pend = new Set();
  for (const m of carregarLote(nn)) {
    pend.add(m.nome);
    for (const t of textosLivres(m).slice(1))
      if (
        INGLES.test(t) ||
        (/[a-z]{4,}/.test(t) && !/[ãõçáéíóúâêô]/.test(t) && INGLES.test(t))
      )
        pend.add(t);
    for (const k of ["tracos", "acoes", "acoesBonus", "reacoes", "lendarias"])
      for (const t of m[k])
        if (
          /^[A-Z][a-z]+( [A-Za-z]+)*( \(.*\))?$/.test(t.nome) &&
          !/[ãõçáéíóúâêô]/.test(t.nome)
        )
          pend.add(t.nome);
  }
  console.log(
    JSON.stringify(Object.fromEntries([...pend].map((t) => [t, ""])), null, 1),
  );
}
