/** Criação de personagem: atributos, perícias e equipamento inicial. */
import { CUSTO_COMPRA_PONTOS, PERICIAS, PONTOS_DISPONIVEIS } from '../dados/atributos'
import { buscarItem, PACOTES } from '../dados/equipamento'
import { obterAntecedente, obterClasse, obterRaca, obterSubraca } from '../dados'
import type { Especializavel, ItemInventario, Personagem, PericiaId, ValoresAtributos } from '../tipos'
import { modificador, pvPrimeiroNivel } from './calculos'

export type Aleatorio = () => number

/** Custo total da compra de pontos, ou null se algum valor estiver fora de 8–15. */
export function custoCompraPontos(valores: ValoresAtributos): number | null {
  let total = 0
  for (const valor of Object.values(valores)) {
    const custo = CUSTO_COMPRA_PONTOS[valor]
    if (custo === undefined) return null
    total += custo
  }
  return total
}

export function compraPontosValida(valores: ValoresAtributos): boolean {
  const custo = custoCompraPontos(valores)
  return custo !== null && custo <= PONTOS_DISPONIVEIS
}

export function rolarDado(lados: number, aleatorio: Aleatorio = Math.random): number {
  return Math.floor(aleatorio() * lados) + 1
}

/** 4d6 descartando o menor (LdJ p. 13). */
export function rolar4d6(aleatorio: Aleatorio = Math.random): { dados: number[]; descartado: number; total: number } {
  const dados = [1, 2, 3, 4].map(() => rolarDado(6, aleatorio))
  const descartado = Math.min(...dados)
  const total = dados.reduce((a, b) => a + b, 0) - descartado
  return { dados, descartado, total }
}

/** Perícias que já vêm de raça, sub-raça e antecedente (antes das escolhas de classe). */
export function periciasFixas(racaId: string, subracaId: string | null, antecedenteId: string): PericiaId[] {
  const raca = obterRaca(racaId)
  const subraca = obterSubraca(raca, subracaId)
  return Array.from(new Set([...raca.pericias, ...(subraca?.pericias ?? []), ...obterAntecedente(antecedenteId).pericias]))
}

/**
 * Quantas perícias o jogador escolhe livremente por sobreposição: quando raça e
 * antecedente dão a mesma perícia, escolhe-se outra (LdJ p. 127).
 */
export function periciasRepetidas(racaId: string, subracaId: string | null, antecedenteId: string): number {
  const raca = obterRaca(racaId)
  const subraca = obterSubraca(raca, subracaId)
  const todas = [...raca.pericias, ...(subraca?.pericias ?? []), ...obterAntecedente(antecedenteId).pericias]
  return todas.length - new Set(todas).size
}

/** Opções da classe que ainda não são proficientes. */
export function opcoesDePericiaDaClasse(classeId: string, fixas: PericiaId[]): PericiaId[] {
  return obterClasse(classeId).pericias.opcoes.filter((p) => !fixas.includes(p))
}

export function todasAsPericias(): PericiaId[] {
  return PERICIAS.map((p) => p.id)
}

/** Especializações possíveis: perícias proficientes e, para o ladino, ferramentas de ladrão. */
export function opcoesDeEspecializacao(proficientes: PericiaId[], classeId: string): Especializavel[] {
  const extras: Especializavel[] = obterClasse(classeId).ferramentas.includes('Ferramentas de ladrão')
    ? ['ferramentasDeLadrao']
    : []
  return [...proficientes, ...extras]
}

let contador = 0
export function novoId(prefixo = 'id'): string {
  contador += 1
  const aleatorio = Math.random().toString(36).slice(2, 8)
  return `${prefixo}-${Date.now().toString(36)}-${aleatorio}${contador}`
}

/** Converte ids do catálogo (e pacotes) em itens de inventário. */
export function itensDoCatalogo(lista: { itemId: string; quantidade: number }[]): ItemInventario[] {
  const resultado: ItemInventario[] = []
  const adicionar = (itemId: string, quantidade: number) => {
    const existente = resultado.find((i) => i.itemId === itemId)
    if (existente) {
      existente.quantidade += quantidade
      return
    }
    const item = buscarItem(itemId)
    if (!item) throw new Error(`Item desconhecido: ${itemId}`)
    resultado.push({
      uid: novoId('item'),
      itemId,
      nome: item.nome,
      quantidade,
      peso: item.peso,
      equipado: item.tipo === 'armadura',
      notas: '',
    })
  }
  for (const { itemId, quantidade } of lista) {
    const pacote = PACOTES[itemId]
    if (pacote) pacote.itens.forEach((i) => adicionar(i.itemId, i.quantidade * quantidade))
    else adicionar(itemId, quantidade)
  }
  return resultado
}

export interface EscolhasDeCriacao {
  nome: string
  conceito: string
  jogador: string
  racaId: string
  subracaId: string | null
  classeId: string
  antecedenteId: string
  metodoAtributos: Personagem['metodoAtributos']
  atributosBase: ValoresAtributos
  periciasEscolhidas: PericiaId[]
  especializacoes: Especializavel[]
  ferramentasEscolhidas: string[]
  idiomasEscolhidos: string[]
  /** Índice da opção escolhida em cada escolha de equipamento da classe. */
  equipamento: Record<string, number>
}

export function equipamentoInicial(escolhas: Pick<EscolhasDeCriacao, 'classeId' | 'antecedenteId' | 'equipamento'>): ItemInventario[] {
  const classe = obterClasse(escolhas.classeId)
  const antecedente = obterAntecedente(escolhas.antecedenteId)
  const escolhidos = classe.equipamentoEscolhas.flatMap((escolha) => {
    const opcao = escolha.opcoes[escolhas.equipamento[escolha.id] ?? 0]
    return opcao ? opcao.itens : []
  })
  return itensDoCatalogo([...classe.equipamentoFixo, ...escolhidos, ...antecedente.equipamento])
}

export function criarPersonagem(escolhas: EscolhasDeCriacao, agora = new Date()): Personagem {
  const classe = obterClasse(escolhas.classeId)
  const antecedente = obterAntecedente(escolhas.antecedenteId)
  const raca = obterRaca(escolhas.racaId)
  const subraca = obterSubraca(raca, escolhas.subracaId)
  const con = escolhas.atributosBase.con + (raca.aumentos.con ?? 0) + (subraca?.aumentos.con ?? 0)
  const pv = pvPrimeiroNivel(classe.dadoDeVida, modificador(con))
  const data = agora.toISOString()
  return {
    versao: 1,
    sistema: 'dnd5e',
    id: novoId('pj'),
    nome: escolhas.nome.trim() || 'Sem nome',
    conceito: escolhas.conceito.trim(),
    jogador: escolhas.jogador.trim(),
    criadoEm: data,
    atualizadoEm: data,
    racaId: escolhas.racaId,
    subracaId: escolhas.subracaId,
    classeId: escolhas.classeId,
    subclasseId: null,
    antecedenteId: escolhas.antecedenteId,
    nivel: 1,
    metodoAtributos: escolhas.metodoAtributos,
    atributosBase: { ...escolhas.atributosBase },
    incrementos: [],
    periciasEscolhidas: [...escolhas.periciasEscolhidas],
    especializacoes: [...escolhas.especializacoes],
    ferramentasEscolhidas: [...escolhas.ferramentasEscolhidas],
    idiomasEscolhidos: [...escolhas.idiomasEscolhidos],
    pvPorNivel: [],
    estado: {
      pvAtual: Math.max(1, pv),
      pvTemporario: 0,
      dadosDeVidaGastos: 0,
      inspiracao: false,
      espacosGastos: [],
      morte: { sucessos: 0, falhas: 0 },
    },
    inventario: equipamentoInicial(escolhas),
    moedas: { pc: 0, pp: 0, pe: 0, po: antecedente.moedasPo, pl: 0 },
    personalidade: { tracos: '', ideais: '', vinculos: '', defeitos: '' },
    anotacoes: '',
    anotacoesHabilidades: {},
  }
}

/** Ferramentas repetidas entre classe e antecedente: cada repetição vira uma escolha livre (LdJ p. 127). */
export function ferramentasRepetidas(classeId: string, antecedenteId: string): string[] {
  const daClasse = obterClasse(classeId).ferramentas
  return obterAntecedente(antecedenteId).ferramentas.filter((f) => daClasse.includes(f))
}
