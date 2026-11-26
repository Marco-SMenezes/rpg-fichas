/**
 * Rolador de dados: interpreta expressões como "2d6+3" ou "1d20-1".
 * Variações por grupo de dados:
 *   4d6kh1  fica com o maior      4d6kl1  fica com o menor
 *   4d6kh3  os 3 maiores          4d6kl2  os 2 menores
 *   4d6dl1  descarta o menor      4d6dh1  descarta o maior
 *   6d6>=5  conta quantos deram 5 ou mais (sucessos)
 */

export type Aleatorio = () => number
export type Modo = 'normal' | 'vantagem' | 'desvantagem'

/** O que fazer com os dados de um grupo além de somar. */
export type Regra =
  | { tipo: 'kh' | 'kl' | 'dh' | 'dl'; n: number }
  | { tipo: 'sucesso'; alvo: number }

export interface Termo {
  quantidade: number
  lados: number
  regra?: Regra
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
  /** Quando a rolagem conta sucessos, o total é a contagem. */
  sucessos?: boolean
}

const TERMO = /([+-]?)(\d*)d(\d+)(?:(kh|kl|dh|dl)(\d*)|(>=|>)(\d+))?|([+-]?)(\d+)/g

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
      let regra: Regra | undefined
      if (m[4]) {
        const n = m[5] ? Number(m[5]) : 1
        const tipo = m[4] as 'kh' | 'kl' | 'dh' | 'dl'
        // Manter: de 1 até todos. Descartar: precisa sobrar pelo menos um.
        if (n < 1 || n > quantidade || ((tipo === 'dh' || tipo === 'dl') && n >= quantidade)) return null
        regra = { tipo, n }
      } else if (m[6]) {
        const alvo = Number(m[7]) + (m[6] === '>' ? 1 : 0)
        if (alvo < 1 || alvo > lados) return null
        regra = { tipo: 'sucesso', alvo }
      }
      dados.push(regra ? { quantidade, lados, regra } : { quantidade, lados })
    } else if (m[9]) {
      modificador += (m[8] === '-' ? -1 : 1) * Number(m[9])
    }
  }
  if (consumido !== limpo || (dados.length === 0 && modificador === 0 && !/^[+-]?0$/.test(limpo))) return null
  return { dados, modificador }
}

function sufixo(r: Regra | undefined): string {
  if (!r) return ''
  return r.tipo === 'sucesso' ? `>=${r.alvo}` : `${r.tipo}${r.n}`
}

export function formatarExpressao(e: Expressao): string {
  const partes = e.dados.map((d) => `${d.quantidade}d${d.lados}${sufixo(d.regra)}`).join('+')
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
  let soma = 0
  let contagem = 0
  const contaSucessos = expressao.dados.some((t) => t.regra?.tipo === 'sucesso')

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
      soma += fica
      continue
    }
    const grupo: ResultadoDado[] = Array.from({ length: quantidade }, () => ({
      lados: termo.lados,
      valor: rolarDado(termo.lados, aleatorio),
      descartado: false,
    }))
    aplicarRegra(grupo, termo.regra)
    dados.push(...grupo)
    const valendo = grupo.filter((d) => !d.descartado)
    if (termo.lados === 20 && valendo.length === 1 && termo.regra?.tipo !== 'sucesso') d20 = valendo[0]!.valor
    if (termo.regra?.tipo === 'sucesso') contagem += valendo.length
    else soma += valendo.reduce((t, d) => t + d.valor, 0)
  }

  return {
    expressao: formatarExpressao(expressao),
    rotulo,
    modo,
    critico,
    dados,
    modificador: expressao.modificador,
    total: (contaSucessos ? contagem + soma : soma) + expressao.modificador,
    d20,
    ...(contaSucessos ? { sucessos: true } : {}),
  }
}

/** Marca como descartados os dados que a regra tira da conta. */
function aplicarRegra(grupo: ResultadoDado[], regra: Regra | undefined) {
  if (!regra) return
  if (regra.tipo === 'sucesso') {
    for (const d of grupo) d.descartado = d.valor < regra.alvo
    return
  }
  // Ordem do menor para o maior; empates ficam com o primeiro rolado.
  const ordem = grupo.map((d, i) => ({ d, i })).sort((a, b) => a.d.valor - b.d.valor || a.i - b.i)
  const n = regra.n
  const fora =
    regra.tipo === 'kh' ? ordem.slice(0, grupo.length - n)
    : regra.tipo === 'kl' ? ordem.slice(n)
    : regra.tipo === 'dl' ? ordem.slice(0, n)
    : ordem.slice(grupo.length - n)
  for (const { d } of fora) d.descartado = true
}

/** "+3", "−1", "+0": como bônus aparecem na ficha. */
export function sinal(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`
}

/** Teste de d20 com bônus. */
export function expressaoTeste(bonus: number): string {
  return `1d20${bonus >= 0 ? '+' : '-'}${Math.abs(bonus)}`
}
