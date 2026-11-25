/** Ficha em jogo: dano, cura, descansos e subida de nível. Tudo imutável. */
import { obterClasse } from '../dados'
import { criarPersonagem, type EscolhasDeCriacao } from './criacao'
import type { EscolhaDeClasse, Especializavel, EstadoDeJogo, Incremento, Personagem, ValoresAtributos } from '../tipos'
import { dadosDeVidaRecuperados, pvMedioPorNivel } from './calculos'
import { calcularFicha } from './ficha'

function comEstado(p: Personagem, estado: Partial<EstadoDeJogo>): Personagem {
  return { ...p, estado: { ...p.estado, ...estado } }
}

/** Dano tira primeiro dos PV temporários (LdJ p. 200). */
export function aplicarDano(p: Personagem, dano: number): Personagem {
  const valor = Math.max(0, Math.floor(dano))
  const doTemporario = Math.min(p.estado.pvTemporario, valor)
  const restante = valor - doTemporario
  return comEstado(p, {
    pvTemporario: p.estado.pvTemporario - doTemporario,
    pvAtual: Math.max(0, p.estado.pvAtual - restante),
  })
}

/** Cura não passa do máximo nem recupera PV temporários. Sair de 0 PV zera os testes contra a morte. */
export function curar(p: Personagem, cura: number): Personagem {
  const max = calcularFicha(p).pvMaximo
  const pvAtual = Math.min(max, p.estado.pvAtual + Math.max(0, Math.floor(cura)))
  const morte = p.estado.pvAtual === 0 && pvAtual > 0 ? { sucessos: 0, falhas: 0 } : p.estado.morte
  return comEstado(p, { pvAtual, morte })
}

/** PV temporários não se somam: o jogador fica com o valor que escolher (LdJ p. 200). */
export function definirTemporario(p: Personagem, valor: number): Personagem {
  return comEstado(p, { pvTemporario: Math.max(0, Math.floor(valor)) })
}

/**
 * Descanso curto: gasta dados de vida. Cada dado rolado + mod. Con, mínimo 0 (LdJ p. 188).
 * `rolagens` são os resultados dos dados gastos.
 */
export function descansoCurto(p: Personagem, rolagens: number[]): Personagem {
  const ficha = calcularFicha(p)
  const gastos = Math.min(rolagens.length, ficha.dadosDeVidaRestantes)
  const cura = rolagens
    .slice(0, gastos)
    .reduce((total, r) => total + Math.max(0, r + ficha.atributos.con.modificador), 0)
  const curado = curar(p, cura)
  const curtos = new Set(ficha.recursos.filter((r) => r.recarga === 'curto').map((r) => r.id))
  const recursosGastos = Object.fromEntries(Object.entries(p.estado.recursosGastos ?? {}).filter(([id]) => !curtos.has(id)))
  return comEstado(curado, { dadosDeVidaGastos: p.estado.dadosDeVidaGastos + gastos, recursosGastos })
}

/**
 * Descanso longo (LdJ p. 188): PV ao máximo, recupera metade dos dados de vida,
 * espaços de magia voltam e PV temporários acabam (p. 200). Exige ao menos 1 PV.
 */
export function descansoLongo(p: Personagem): Personagem {
  if (p.estado.pvAtual < 1) return p
  const ficha = calcularFicha(p)
  const recuperados = dadosDeVidaRecuperados(ficha.dadosDeVidaTotal)
  return comEstado(p, {
    pvAtual: ficha.pvMaximo,
    pvTemporario: 0,
    dadosDeVidaGastos: Math.max(0, p.estado.dadosDeVidaGastos - recuperados),
    espacosGastos: [],
    recursosGastos: {},
    morte: { sucessos: 0, falhas: 0 },
  })
}

/** Gasta (+1) ou devolve (-1) um uso de recurso de classe. */
export function usarRecurso(p: Personagem, id: string, delta: 1 | -1): Personagem {
  const recurso = calcularFicha(p).recursos.find((r) => r.id === id)
  if (!recurso) return p
  const atual = p.estado.recursosGastos?.[id] ?? 0
  const limite = recurso.maximo ?? Infinity
  const novo = Math.min(limite, Math.max(0, atual + delta))
  return comEstado(p, { recursosGastos: { ...p.estado.recursosGastos, [id]: novo } })
}

export function gastarEspaco(p: Personagem, nivelMagia: number, delta: 1 | -1): Personagem {
  const ficha = calcularFicha(p)
  const total = ficha.conjuracao?.espacos[nivelMagia - 1] ?? 0
  const gastos = [...p.estado.espacosGastos]
  while (gastos.length < nivelMagia) gastos.push(0)
  gastos[nivelMagia - 1] = Math.min(total, Math.max(0, (gastos[nivelMagia - 1] ?? 0) + delta))
  return comEstado(p, { espacosGastos: gastos })
}

/** O que o próximo nível pede ao jogador. */
export interface RequisitosDeNivel {
  novoNivel: number
  dadoDeVida: number
  pvMedio: number
  escolherSubclasse: boolean
  incremento: boolean
  especializacoes: number
  novasHabilidades: string[]
  /** Escolhas da classe neste nível (as da subclasse aparecem quando ela já é conhecida). */
  escolhas: EscolhaDeClasse[]
}

export function requisitosDoProximoNivel(p: Personagem): RequisitosDeNivel | null {
  if (p.nivel >= 20) return null
  return requisitosDoNivel(p.classeId, p.nivel + 1, p.subclasseId)
}

/** O que a classe pede ao chegar em `novoNivel` (2 a 20). */
export function requisitosDoNivel(classeId: string, novoNivel: number, subclasseId: string | null = null): RequisitosDeNivel {
  const classe = obterClasse(classeId)
  const subclasse = classe.subclasses.find((s) => s.id === subclasseId)
  return {
    escolhas: [...(classe.escolhas ?? []), ...(subclasse?.escolhas ?? [])].filter((e) => e.nivel === novoNivel),
    novoNivel,
    dadoDeVida: classe.dadoDeVida,
    pvMedio: pvMedioPorNivel(classe.dadoDeVida),
    escolherSubclasse: novoNivel === classe.nivelSubclasse,
    incremento: classe.niveisIncremento.includes(novoNivel),
    especializacoes: classe.especializacao?.find((e) => e.nivel === novoNivel)?.quantidade ?? 0,
    novasHabilidades: classe.habilidades.filter((h) => h.nivel === novoNivel).map((h) => h.nome),
  }
}

export interface EscolhasDeNivel {
  /** Resultado do dado de vida (ou o valor médio). */
  pv: number
  subclasseId?: string
  incremento?: Partial<ValoresAtributos>
  especializacoes?: Especializavel[]
  escolhas?: Record<string, string>
}

/** Incremento válido: +2 em um atributo ou +1 em dois, sem passar de 20 (LdJ p. 91). */
export function incrementoValido(aumentos: Partial<ValoresAtributos>): boolean {
  const valores = Object.values(aumentos).filter((v): v is number => !!v)
  const soma = valores.reduce((a, b) => a + b, 0)
  return soma === 2 && valores.every((v) => v === 1 || v === 2)
}

export function subirDeNivel(p: Personagem, escolhas: EscolhasDeNivel): Personagem {
  const req = requisitosDoProximoNivel(p)
  if (!req) throw new Error('Nível máximo atingido.')
  if (escolhas.pv < 1 || escolhas.pv > req.dadoDeVida) throw new Error('Resultado do dado de vida inválido.')
  if (req.escolherSubclasse && !escolhas.subclasseId) throw new Error('Escolha o arquétipo.')
  if (req.incremento && (!escolhas.incremento || !incrementoValido(escolhas.incremento))) {
    throw new Error('Incremento de atributo inválido.')
  }
  if (req.especializacoes && (escolhas.especializacoes?.length ?? 0) !== req.especializacoes) {
    throw new Error(`Escolha ${req.especializacoes} especializações.`)
  }

  const reqComSubclasse = requisitosDoNivel(p.classeId, req.novoNivel, req.escolherSubclasse ? (escolhas.subclasseId ?? null) : p.subclasseId)
  for (const e of reqComSubclasse.escolhas) {
    const valor = escolhas.escolhas?.[e.id]
    if (!valor || !e.opcoes.some((o) => o.id === valor)) throw new Error(`Escolha: ${e.rotulo}.`)
  }

  const antes = calcularFicha(p).pvMaximo
  const incrementos: Incremento[] = req.incremento
    ? [...p.incrementos, { nivel: req.novoNivel, aumentos: escolhas.incremento! }]
    : p.incrementos
  const novo: Personagem = {
    ...p,
    nivel: req.novoNivel,
    subclasseId: req.escolherSubclasse ? escolhas.subclasseId! : p.subclasseId,
    incrementos,
    especializacoes: [...p.especializacoes, ...(escolhas.especializacoes ?? [])],
    escolhasDeClasse: { ...p.escolhasDeClasse, ...escolhas.escolhas },
    pvPorNivel: [...p.pvPorNivel.slice(0, p.nivel - 1), escolhas.pv],
  }
  const depois = calcularFicha(novo).pvMaximo
  // Os PV atuais sobem o mesmo tanto que o máximo.
  return comEstado(novo, { pvAtual: Math.max(0, p.estado.pvAtual + (depois - antes)) })
}

/**
 * Cria um personagem já num nível acima do 1º: monta o 1º nível e aplica cada
 * subida em sequência, com as mesmas regras de subirDeNivel. `niveis[0]` é o 2º nível.
 */
export function criarEmNivel(escolhas: EscolhasDeCriacao, niveis: EscolhasDeNivel[], agora = new Date()): Personagem {
  return niveis.reduce((p, n) => subirDeNivel(p, n), criarPersonagem(escolhas, agora))
}
