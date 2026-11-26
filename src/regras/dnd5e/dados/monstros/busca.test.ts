import { describe, expect, it } from "vitest";
import {
  filtrarMonstros,
  ndComoNumero,
  normalizarMonstro,
  xpDoNd,
} from "./busca";
import type { Monstro } from "./tipos";

const m = (
  nome: string,
  nomeOriginal: string,
  nd: string,
  tipo = "Humanoide",
): Monstro =>
  normalizarMonstro(
    { id: `srd-${nomeOriginal.toLowerCase()}`, nome, nomeOriginal, nd, tipo },
    "srd",
  ) as Monstro;

describe("nível de desafio", () => {
  it("lê frações e inteiros", () => {
    expect(ndComoNumero("1/8")).toBe(0.125);
    expect(ndComoNumero("1/2")).toBe(0.5);
    expect(ndComoNumero("10")).toBe(10);
  });
  it("XP pela tabela do SRD", () => {
    expect(xpDoNd("1/4")).toBe(50);
    expect(xpDoNd("5")).toBe(1800);
    expect(xpDoNd("30")).toBe(155000);
  });
});

describe("normalizarMonstro", () => {
  it("preenche os padrões", () => {
    const g = normalizarMonstro({ nome: "Goblin" }, "meu")!;
    expect(g.ca).toBe(10);
    expect(g.pv).toBe(1);
    expect(g.atributos.for).toBe(10);
    expect([
      g.tracos,
      g.acoes,
      g.acoesBonus,
      g.reacoes,
      g.lendarias,
      g.pericias,
    ]).toEqual([[], [], [], [], [], []]);
    expect(g.id.startsWith("monstro-")).toBe(true);
    expect(g.origem).toBe("meu");
  });
  it("sem nome não é monstro", () => {
    expect(normalizarMonstro(null, "meu")).toBeNull();
    expect(normalizarMonstro({}, "meu")).toBeNull();
  });
});

describe("filtrarMonstros", () => {
  const lista = [
    m("Urso-coruja", "Owlbear", "3", "Monstruosidade"),
    m("Goblin", "Goblin", "1/4"),
    m("Dragão Vermelho Adulto", "Adult Red Dragon", "17", "Dragão"),
  ];
  const f = { termo: "", tipo: "", ndMin: null, ndMax: null };
  it("busca pelo nome em inglês e sem acento/hífen", () => {
    expect(
      filtrarMonstros(lista, { ...f, termo: "owlbear" }).map((x) => x.nome),
    ).toEqual(["Urso-coruja"]);
    expect(
      filtrarMonstros(lista, { ...f, termo: "urso coruja" }).map((x) => x.nome),
    ).toEqual(["Urso-coruja"]);
    expect(
      filtrarMonstros(lista, { ...f, termo: "dragao" }).map((x) => x.nome),
    ).toEqual(["Dragão Vermelho Adulto"]);
  });
  it("filtra por ND como número", () => {
    expect(
      filtrarMonstros(lista, { ...f, ndMax: 1 }).map((x) => x.nome),
    ).toEqual(["Goblin"]);
    expect(
      filtrarMonstros(lista, { ...f, ndMin: 3 }).map((x) => x.nome),
    ).toEqual(["Dragão Vermelho Adulto", "Urso-coruja"]);
  });
  it("filtra por tipo e ordena por nome", () => {
    expect(
      filtrarMonstros(lista, { ...f, tipo: "Dragão" }).map((x) => x.nome),
    ).toEqual(["Dragão Vermelho Adulto"]);
    expect(filtrarMonstros(lista, f).map((x) => x.nome)).toEqual([
      "Dragão Vermelho Adulto",
      "Goblin",
      "Urso-coruja",
    ]);
  });
});
