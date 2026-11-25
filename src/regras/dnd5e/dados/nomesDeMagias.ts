import { MAGIAS } from './magias'

const chave = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const POR_NOME = new Map(MAGIAS.map((m) => [chave(m.nome), m.id]))

/** Nomes que não acharam magia (o teste garante que fique vazio). */
export const NOMES_NAO_ENCONTRADOS: string[] = []

/** Converte nomes de magia como aparecem nas tabelas do livro em ids. */
export function magias(...nomes: string[]): string[] {
  return nomes.map((n) => {
    const id = POR_NOME.get(chave(n))
    if (!id) NOMES_NAO_ENCONTRADOS.push(n)
    return id ?? n
  })
}
