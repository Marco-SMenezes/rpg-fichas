/**
 * Fórmulas da ficha livre: números, nomes de campos, + − × ÷, parênteses e
 * algumas funções (floor, ceil, round, min, max, abs). É um leitor próprio:
 * nada do que o jogador digita é executado como código.
 *
 *   forca * 2 + 3      floor((destreza - 10) / 2)      max(1, vigor - cansaco)
 */

export type No =
  | { tipo: 'numero'; valor: number }
  | { tipo: 'nome'; nome: string }
  | { tipo: 'sinal'; no: No }
  | { tipo: 'op'; op: '+' | '-' | '*' | '/'; esq: No; dir: No }
  | { tipo: 'funcao'; nome: string; args: No[] }

export const FUNCOES: Record<string, { min: number; max: number; f: (...a: number[]) => number }> = {
  floor: { min: 1, max: 1, f: Math.floor },
  ceil: { min: 1, max: 1, f: Math.ceil },
  round: { min: 1, max: 1, f: Math.round },
  abs: { min: 1, max: 1, f: Math.abs },
  min: { min: 1, max: 20, f: Math.min },
  max: { min: 1, max: 20, f: Math.max },
}

export class ErroDeFormula extends Error {}

type Token = { t: 'num'; v: number } | { t: 'nome'; v: string } | { t: 'sim'; v: string }

function tokenizar(texto: string): Token[] {
  const tokens: Token[] = []
  const s = texto.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, ',')
  let i = 0
  while (i < s.length) {
    const c = s[i]!
    if (/\s/.test(c)) {
      i++
    } else if (/[0-9.]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.]/.test(s[j]!)) j++
      const v = Number(s.slice(i, j))
      if (!Number.isFinite(v)) throw new ErroDeFormula(`Número inválido: ${s.slice(i, j)}`)
      tokens.push({ t: 'num', v })
      i = j
    } else if (/[\p{L}_]/u.test(c)) {
      let j = i
      while (j < s.length && /[\p{L}\p{N}_]/u.test(s[j]!)) j++
      tokens.push({ t: 'nome', v: s.slice(i, j) })
      i = j
    } else if ('+-*/(),'.includes(c)) {
      tokens.push({ t: 'sim', v: c })
      i++
    } else {
      throw new ErroDeFormula(`Símbolo não entendido: "${c}"`)
    }
  }
  return tokens
}

/** Lê a fórmula e devolve a árvore, ou lança ErroDeFormula com uma mensagem em português. */
export function lerFormula(texto: string): No {
  const tokens = tokenizar(texto)
  let pos = 0
  const olhar = () => tokens[pos]
  const simbolo = (v: string) => olhar()?.t === 'sim' && olhar()!.v === v

  function expressao(): No {
    let no = termo()
    while (simbolo('+') || simbolo('-')) {
      const op = tokens[pos++]!.v as '+' | '-'
      no = { tipo: 'op', op, esq: no, dir: termo() }
    }
    return no
  }
  function termo(): No {
    let no = fator()
    while (simbolo('*') || simbolo('/')) {
      const op = tokens[pos++]!.v as '*' | '/'
      no = { tipo: 'op', op, esq: no, dir: fator() }
    }
    return no
  }
  function fator(): No {
    const tk = olhar()
    if (!tk) throw new ErroDeFormula('A fórmula terminou no meio.')
    if (tk.t === 'sim' && (tk.v === '-' || tk.v === '+')) {
      pos++
      const no = fator()
      return tk.v === '-' ? { tipo: 'sinal', no } : no
    }
    if (tk.t === 'num') {
      pos++
      return { tipo: 'numero', valor: tk.v }
    }
    if (tk.t === 'nome') {
      pos++
      if (simbolo('(')) {
        pos++
        const nome = tk.v.toLowerCase()
        const fn = FUNCOES[nome]
        if (!fn) throw new ErroDeFormula(`Função desconhecida: ${tk.v}`)
        const args: No[] = []
        if (!simbolo(')')) {
          args.push(expressao())
          while (simbolo(',')) {
            pos++
            args.push(expressao())
          }
        }
        if (!simbolo(')')) throw new ErroDeFormula('Falta fechar o parêntese.')
        pos++
        if (args.length < fn.min || args.length > fn.max) throw new ErroDeFormula(`${nome} recebe ${fn.min === fn.max ? fn.min : `de ${fn.min} a ${fn.max}`} valor(es).`)
        return { tipo: 'funcao', nome, args }
      }
      return { tipo: 'nome', nome: tk.v }
    }
    if (simbolo('(')) {
      pos++
      const no = expressao()
      if (!simbolo(')')) throw new ErroDeFormula('Falta fechar o parêntese.')
      pos++
      return no
    }
    throw new ErroDeFormula(`Não esperava "${tk.v}" aqui.`)
  }

  if (tokens.length === 0) throw new ErroDeFormula('Fórmula vazia.')
  const no = expressao()
  if (pos < tokens.length) throw new ErroDeFormula(`Sobrou "${(tokens[pos] as Token).v}" no fim.`)
  return no
}

/** Nomes de campos que a fórmula usa (para achar dependências e ciclos). */
export function nomesUsados(no: No): string[] {
  switch (no.tipo) {
    case 'numero':
      return []
    case 'nome':
      return [no.nome]
    case 'sinal':
      return nomesUsados(no.no)
    case 'op':
      return [...nomesUsados(no.esq), ...nomesUsados(no.dir)]
    case 'funcao':
      return no.args.flatMap(nomesUsados)
  }
}

/** Calcula a árvore. Nome sem valor vira erro; divisão por zero dá 0. */
export function calcular(no: No, valor: (nome: string) => number | undefined): number {
  switch (no.tipo) {
    case 'numero':
      return no.valor
    case 'nome': {
      const v = valor(no.nome)
      if (v === undefined) throw new ErroDeFormula(`Campo desconhecido: ${no.nome}`)
      return v
    }
    case 'sinal':
      return -calcular(no.no, valor)
    case 'op': {
      const a = calcular(no.esq, valor)
      const b = calcular(no.dir, valor)
      if (no.op === '+') return a + b
      if (no.op === '-') return a - b
      if (no.op === '*') return a * b
      return b === 0 ? 0 : a / b
    }
    case 'funcao':
      return FUNCOES[no.nome]!.f(...no.args.map((x) => calcular(x, valor)))
  }
}
