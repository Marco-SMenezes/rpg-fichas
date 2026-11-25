/** Rolador de dados: interpreta expressões como "2d6+3" ou "1d20-1". */

export type Aleatorio = () => number
export type Modo = 'normal' | 'vantagem' | 'desvantagem'

export interface Termo {
  quantidade: number
  lados: number
}

export interface Expressao {
  dados: Termo[]
  modificador: number
}

export interface ResultadoDado {
  lados: number
  valor: number
  descartado: boolean
}

export interface Rolagem {
  expressao: string
  rotulo: string
  modo: Modo
  critico: boolean
  dados: ResultadoDado[]
  modificador: number
  total: number
  /** Resultado do d20 que valeu (para destacar 1 e 20 naturais). */
  d20: number | null
}

const TERMO = /([+-]?)\s*(\d*)\s*d\s*(\d+)|([+-]?)\s*(\d+)/gi

export function interpretar(texto: string): Expressao | null {
  const limpo = texto.replace(/\s+/g, '').replace(/−/g, '-').toLowerCase()
  if (!limpo) return null
  const dados: Termo[] = []
  let modificador = 0
  let consumido = ''
  for (const m of limpo.matchAll(TERMO)) {
    consumido += m[0]
    if (m[3]) {
      const quantidade = m[2] ? Number(m[2]) : 1
      const lados = Number(m[3])
      if (m[1] === '-' || quantidade < 1 || quantidade > 100 || lados < 2 || lados > 1000) return null
      dados.push({ quantidade, lados })
    } else if (m[5]) {
      modificador += (m[4] === '-' ? -1 : 1) * Number(m[5])
    }
  }
  if (consumido !== limpo || (dados.length === 0 && modificador === 0 && !/^[+-]?0$/.test(limpo))) return null
  return { dados, modificador }
}

export function formatarExpressao(e: Expressao): string {
  const partes = e.dados.map((d) => `${d.quantidade}d${d.lados}`).join('+')
  if (e.modificador === 0) return partes || '0'
  return `${partes}${e.modificador > 0 ? '+' : '−'}${Math.abs(e.modificador)}`
}

export function rolarDado(lados: number, aleatorio: Aleatorio): number {
  return Math.floor(aleatorio() * lados) + 1
}

export interface OpcoesDeRolagem {
  rotulo?: string
  modo?: Modo
  /** Crítico: dobra a quantidade de dados (LdJ p. 198). */
  critico?: boolean
  aleatorio?: Aleatorio
}

export function rolar(texto: string, opcoes: OpcoesDeRolagem = {}): Rolagem | null {
  const expressao = interpretar(texto)
  if (!expressao) return null
  const { modo = 'normal', critico = false, aleatorio = Math.random, rotulo = '' } = opcoes
  const dados: ResultadoDado[] = []
  let d20: number | null = null

  for (const termo of expressao.dados) {
    const quantidade = critico ? termo.quantidade * 2 : termo.quantidade
    const comVantagem = termo.lados === 20 && quantidade === 1 && modo !== 'normal'
    if (comVantagem) {
      const a = rolarDado(20, aleatorio)
      const b = rolarDado(20, aleatorio)
      const fica = modo === 'vantagem' ? Math.max(a, b) : Math.min(a, b)
      const descartaPrimeiro = a !== fica
      dados.push({ lados: 20, valor: a, descartado: descartaPrimeiro })
      dados.push({ lados: 20, valor: b, descartado: !descartaPrimeiro })
      d20 = fica
      continue
    }
    for (let i = 0; i < quantidade; i++) {
      const valor = rolarDado(termo.lados, aleatorio)
      dados.push({ lados: termo.lados, valor, descartado: false })
      if (termo.lados === 20 && quantidade === 1) d20 = valor
    }
  }

  const soma = dados.filter((d) => !d.descartado).reduce((t, d) => t + d.valor, 0)
  return {
    expressao: formatarExpressao(expressao),
    rotulo,
    modo,
    critico,
    dados,
    modificador: expressao.modificador,
    total: soma + expressao.modificador,
    d20,
  }
}

/** "+3", "−1", "+0": como bônus aparecem na ficha. */
export function sinal(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`
}

/** Teste de d20 com bônus. */
export function expressaoTeste(bonus: number): string {
  return `1d20${bonus >= 0 ? '+' : '-'}${Math.abs(bonus)}`
}
