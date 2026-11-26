/**
 * Ficha livre (Etapa 4): o jogador monta o modelo (campos, abas, larguras) e
 * cria fichas a partir dele. Serve para qualquer sistema. Funções puras.
 */
import { calcular, ErroDeFormula, lerFormula, nomesUsados } from './formula'

export type TipoCampo = 'texto' | 'textoLongo' | 'numero' | 'marcador' | 'formula' | 'recurso' | 'rolagem' | 'lista'

export const TIPOS_DE_CAMPO: { id: TipoCampo; nome: string; ajuda: string }[] = [
  { id: 'numero', nome: 'Número', ajuda: 'Um valor que o jogador muda (atributo, nível, dinheiro…).' },
  { id: 'recurso', nome: 'Recurso (atual/máximo)', ajuda: 'Vida, mana, sanidade: − e + com máximo (número ou fórmula).' },
  { id: 'formula', nome: 'Fórmula', ajuda: 'Calculado sozinho a partir de outros campos.' },
  { id: 'rolagem', nome: 'Rolagem', ajuda: 'Botão que rola dados mais um bônus (fórmula).' },
  { id: 'texto', nome: 'Texto curto', ajuda: 'Nome, classe, origem…' },
  { id: 'textoLongo', nome: 'Texto longo', ajuda: 'História, anotações, descrição.' },
  { id: 'marcador', nome: 'Marcador', ajuda: 'Uma caixinha de sim/não (treinado, ferido…).' },
  { id: 'lista', nome: 'Lista', ajuda: 'Itens que o jogador adiciona e remove (inventário, poderes).' },
]

export interface Campo {
  id: string
  /** Nome usado nas fórmulas: só letras, números e _. */
  chave: string
  rotulo: string
  tipo: TipoCampo
  /** Aba em que aparece. */
  secao: string
  /** Largura em colunas (de 12 no computador; no celular se ajusta). */
  largura: 3 | 4 | 6 | 8 | 12
  /** Número/recurso: valor inicial. */
  padrao?: number
  /** Fórmula (tipo fórmula), bônus (rolagem) ou máximo (recurso). */
  expressao?: string
  /** Rolagem: dados, como "1d20" ou "3d6". */
  dados?: string
  ajuda?: string
}

export interface Modelo {
  id: string
  nome: string
  descricao: string
  secoes: string[]
  campos: Campo[]
  criadoEm: string
  atualizadoEm: string
}

/** Valores de uma ficha: por id de campo. */
export type Valores = Record<string, unknown>

export interface FichaLivre {
  id: string
  modeloId: string
  nome: string
  valores: Valores
  /** Recurso: atual por id (o máximo vem do modelo). */
  criadoEm: string
  atualizadoEm: string
}

export const novoId = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/** "Força de Vontade" → "forca_de_vontade". */
export function chaveDe(rotulo: string): string {
  const base = rotulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return /^[0-9]/.test(base) ? `c_${base}` : base || 'campo'
}

/** Chave que ainda não existe no modelo (forca, forca_2, …). */
export function chaveLivre(modelo: Modelo, desejada: string, ignorarId?: string): string {
  const usadas = new Set(modelo.campos.filter((c) => c.id !== ignorarId).map((c) => c.chave))
  if (!usadas.has(desejada)) return desejada
  let n = 2
  while (usadas.has(`${desejada}_${n}`)) n++
  return `${desejada}_${n}`
}

export function novoCampo(modelo: Modelo, tipo: TipoCampo, secao: string, rotulo = 'Novo campo'): Campo {
  const base: Campo = {
    id: novoId('campo'),
    chave: chaveLivre(modelo, chaveDe(rotulo)),
    rotulo,
    tipo,
    secao,
    largura: tipo === 'textoLongo' || tipo === 'lista' ? 12 : tipo === 'recurso' ? 6 : 3,
  }
  if (tipo === 'numero') return { ...base, padrao: 0 }
  if (tipo === 'recurso') return { ...base, padrao: 10, expressao: '10' }
  if (tipo === 'formula') return { ...base, expressao: '0' }
  if (tipo === 'rolagem') return { ...base, dados: '1d20', expressao: '0' }
  return base
}

/* ---------- Cálculo ---------- */

export interface Calculo {
  /** Valor numérico de cada chave (números, fórmulas, recursos = atual, marcador = 1/0). */
  porChave: Record<string, number>
  /** Fórmula calculada por id de campo (fórmula, bônus de rolagem, máximo de recurso). */
  expressoes: Record<string, number>
  /** Erros por id de campo. */
  erros: Record<string, string>
}

const numero = (v: unknown, padrao = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : padrao)

/** Valor atual de um recurso (o que o jogador marcou, ou o padrão). */
export function atualDoRecurso(campo: Campo, valores: Valores): number {
  return numero(valores[campo.id], campo.padrao ?? 0)
}

/** Calcula todas as fórmulas do modelo com os valores da ficha, detectando ciclos. */
export function calcularFichaLivre(modelo: Modelo, valores: Valores): Calculo {
  const porChave: Record<string, number> = {}
  const expressoes: Record<string, number> = {}
  const erros: Record<string, string> = {}
  const porChaveCampo = new Map(modelo.campos.map((c) => [c.chave, c]))

  for (const c of modelo.campos) {
    if (c.tipo === 'numero') porChave[c.chave] = numero(valores[c.id], c.padrao ?? 0)
    if (c.tipo === 'recurso') porChave[c.chave] = atualDoRecurso(c, valores)
    if (c.tipo === 'marcador') porChave[c.chave] = valores[c.id] === true ? 1 : 0
  }

  // Fórmulas podem depender umas das outras: calcula sob demanda, marcando o caminho para achar ciclos.
  const emCalculo = new Set<string>()
  const formulaDe = (c: Campo): number => {
    if (c.chave in porChave) return porChave[c.chave]!
    if (emCalculo.has(c.chave)) throw new ErroDeFormula(`Ciclo: ${c.chave} depende de si mesmo.`)
    emCalculo.add(c.chave)
    try {
      const v = calcular(lerFormula(c.expressao ?? '0'), valorDe)
      porChave[c.chave] = v
      return v
    } finally {
      emCalculo.delete(c.chave)
    }
  }
  const valorDe = (nome: string): number | undefined => {
    if (nome in porChave) return porChave[nome]
    const c = porChaveCampo.get(nome)
    if (!c) return undefined
    if (c.tipo === 'formula') return formulaDe(c)
    return undefined
  }

  for (const c of modelo.campos) {
    try {
      if (c.tipo === 'formula') expressoes[c.id] = formulaDe(c)
      if (c.tipo === 'rolagem' || c.tipo === 'recurso') {
        const no = lerFormula(c.expressao?.trim() ? c.expressao : '0')
        for (const n of nomesUsados(no)) if (n === c.chave) throw new ErroDeFormula('O campo não pode usar a si mesmo.')
        expressoes[c.id] = calcular(no, valorDe)
      }
    } catch (e) {
      erros[c.id] = e instanceof Error ? e.message : 'Fórmula inválida.'
      if (c.tipo === 'formula') porChave[c.chave] = 0
    }
  }
  return { porChave, expressoes, erros }
}

/** Expressão de rolagem para o rolador: dados + bônus calculado. */
export function expressaoDaRolagem(campo: Campo, calculo: Calculo): string | null {
  const dados = (campo.dados ?? '').replace(/\s+/g, '')
  const bonus = Math.trunc(calculo.expressoes[campo.id] ?? 0)
  if (!dados && !bonus) return null
  if (!dados) return String(bonus)
  return bonus === 0 ? dados : `${dados}${bonus > 0 ? '+' : '-'}${Math.abs(bonus)}`
}

/* ---------- Modelo inicial ---------- */

/** Um modelo de exemplo, genérico, para começar e adaptar. */
export function modeloDeExemplo(agora = new Date().toISOString()): Modelo {
  const m: Modelo = {
    id: novoId('modelo'),
    nome: 'Modelo básico',
    descricao: 'Exemplo para adaptar: atributos de 1 a 5, vida e esforço, testes com d20.',
    secoes: ['Principal', 'Inventário', 'História'],
    campos: [],
    criadoEm: agora,
    atualizadoEm: agora,
  }
  const add = (c: Partial<Campo> & Pick<Campo, 'rotulo' | 'tipo'>) => {
    const campo = { ...novoCampo(m, c.tipo, c.secao ?? 'Principal', c.rotulo), ...c }
    m.campos.push(campo)
    return campo
  }
  add({ rotulo: 'Conceito', tipo: 'texto', largura: 6 })
  add({ rotulo: 'Nível', tipo: 'numero', padrao: 1, largura: 3 })
  add({ rotulo: 'Defesa', tipo: 'formula', expressao: '10 + agilidade + nivel', largura: 3 })
  add({ rotulo: 'Força', tipo: 'numero', padrao: 1 })
  add({ rotulo: 'Agilidade', tipo: 'numero', padrao: 1 })
  add({ rotulo: 'Mente', tipo: 'numero', padrao: 1 })
  add({ rotulo: 'Presença', tipo: 'numero', padrao: 1 })
  add({ rotulo: 'Vida', tipo: 'recurso', expressao: '10 + forca * 2 + nivel * 3', padrao: 15, largura: 6 })
  add({ rotulo: 'Esforço', tipo: 'recurso', expressao: '2 + mente + nivel', padrao: 4, largura: 6 })
  add({ rotulo: 'Teste de Força', tipo: 'rolagem', dados: '1d20', expressao: 'forca' })
  add({ rotulo: 'Teste de Agilidade', tipo: 'rolagem', dados: '1d20', expressao: 'agilidade' })
  add({ rotulo: 'Teste de Mente', tipo: 'rolagem', dados: '1d20', expressao: 'mente' })
  add({ rotulo: 'Teste de Presença', tipo: 'rolagem', dados: '1d20', expressao: 'presenca' })
  add({ rotulo: 'Itens', tipo: 'lista', secao: 'Inventário' })
  add({ rotulo: 'Dinheiro', tipo: 'numero', padrao: 0, secao: 'Inventário' })
  add({ rotulo: 'História', tipo: 'textoLongo', secao: 'História' })
  add({ rotulo: 'Anotações', tipo: 'textoLongo', secao: 'História' })
  return m
}

/** Valores iniciais de uma ficha nova (recursos começam cheios). */
export function valoresIniciais(modelo: Modelo): Valores {
  const valores: Valores = {}
  for (const c of modelo.campos) if (c.tipo === 'numero' && c.padrao !== undefined) valores[c.id] = c.padrao
  const calc = calcularFichaLivre(modelo, valores)
  for (const c of modelo.campos) if (c.tipo === 'recurso') valores[c.id] = Math.max(0, Math.trunc(calc.expressoes[c.id] ?? c.padrao ?? 0))
  return valores
}

/* ---------- Leitura segura (armazenamento e importação) ---------- */

const TIPOS = new Set(TIPOS_DE_CAMPO.map((t) => t.id))
const LARGURAS = new Set([3, 4, 6, 8, 12])

export function normalizarModelo(x: unknown): Modelo | null {
  if (!x || typeof x !== 'object') return null
  const m = x as Partial<Modelo>
  if (typeof m.id !== 'string' || typeof m.nome !== 'string' || !Array.isArray(m.campos)) return null
  const secoes = Array.isArray(m.secoes) && m.secoes.length ? m.secoes.filter((s): s is string => typeof s === 'string') : ['Principal']
  const campos = m.campos
    .filter((c): c is Campo => !!c && typeof c === 'object' && typeof (c as Campo).id === 'string' && TIPOS.has((c as Campo).tipo))
    .map((c) => ({
      ...c,
      rotulo: String(c.rotulo ?? ''),
      chave: String(c.chave ?? chaveDe(String(c.rotulo ?? ''))),
      secao: secoes.includes(c.secao) ? c.secao : secoes[0]!,
      largura: LARGURAS.has(c.largura) ? c.largura : 6,
    }))
  return {
    id: m.id,
    nome: m.nome,
    descricao: typeof m.descricao === 'string' ? m.descricao : '',
    secoes,
    campos,
    criadoEm: typeof m.criadoEm === 'string' ? m.criadoEm : new Date().toISOString(),
    atualizadoEm: typeof m.atualizadoEm === 'string' ? m.atualizadoEm : new Date().toISOString(),
  }
}

export function normalizarFichaLivre(x: unknown): FichaLivre | null {
  if (!x || typeof x !== 'object') return null
  const f = x as Partial<FichaLivre>
  if (typeof f.id !== 'string' || typeof f.modeloId !== 'string') return null
  return {
    id: f.id,
    modeloId: f.modeloId,
    nome: typeof f.nome === 'string' ? f.nome : 'Sem nome',
    valores: f.valores && typeof f.valores === 'object' ? f.valores : {},
    criadoEm: typeof f.criadoEm === 'string' ? f.criadoEm : new Date().toISOString(),
    atualizadoEm: typeof f.atualizadoEm === 'string' ? f.atualizadoEm : new Date().toISOString(),
  }
}

/** Troca a chave de um campo e atualiza as fórmulas que usavam o nome antigo. */
export function renomearChave(modelo: Modelo, campoId: string, desejada: string): Modelo {
  const campo = modelo.campos.find((c) => c.id === campoId)
  if (!campo) return modelo
  const nova = chaveLivre(modelo, chaveDe(desejada), campoId)
  if (nova === campo.chave) return modelo
  const antiga = new RegExp(`(?<![\\p{L}\\p{N}_])${campo.chave}(?![\\p{L}\\p{N}_])`, 'gu')
  return {
    ...modelo,
    campos: modelo.campos.map((c) => ({
      ...c,
      ...(c.id === campoId ? { chave: nova } : {}),
      ...(c.expressao ? { expressao: c.expressao.replace(antiga, nova) } : {}),
    })),
  }
}
