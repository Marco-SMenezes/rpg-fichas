// Junta o esqueleto pré-traduzido com o mapa de tradução do lote e grava o resultado no app.
// Uso: node scripts/bestiario/aplicar.mjs 01   (lê fonte/mapa-01.json)
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarLote, INGLES, textosLivres } from "./pendentes.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const nn = process.argv[2];
const mapa = JSON.parse(
  readFileSync(join(AQUI, "fonte", `mapa-${nn}.json`), "utf8"),
);
const t = (s) => (s && mapa[s] ? mapa[s] : s);
const lote = carregarLote(nn).map((m) => {
  const x = {
    ...m,
    nome: t(m.nome),
    caDescricao: t(m.caDescricao),
    descricaoLendaria: t(m.descricaoLendaria),
    idiomas: t(m.idiomas),
    subtipo: t(m.subtipo),
    deslocamento: t(m.deslocamento),
  };
  for (const k of ["tracos", "acoes", "acoesBonus", "reacoes", "lendarias"])
    x[k] = m[k].map((y) => ({ nome: t(y.nome), texto: t(y.texto) }));
  return x;
});
const sobras = lote.flatMap((m) =>
  textosLivres(m)
    .slice(1)
    .filter((s) => INGLES.test(s))
    .map((s) => `${m.id}: ${s.slice(0, 90)}`),
);
writeFileSync(
  join(
    AQUI,
    "..",
    "..",
    "src/regras/dnd5e/dados/monstros/srd",
    `lote-${nn}.json`,
  ),
  JSON.stringify(lote, null, 1) + "\n",
);
console.log(
  `lote ${nn}: ${lote.length} monstros, ${sobras.length} textos com inglês`,
);
for (const s of sobras) console.log("  " + s);
