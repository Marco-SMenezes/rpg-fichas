/**
 * Motor de regras: recebe as escolhas do personagem e devolve a ficha calculada.
 * Nada aqui depende da interface.
 */
import { ATRIBUTOS, NOME_PERICIA, PERICIAS } from '../dados/atributos'
import { buscarItem } from '../dados/equipamento'
import {
  obterAntecedente,
  obterClasse,
  obterRaca,
  obterSubclasse,
  obterSubraca,
} from '../dados'
import { dadosAtaqueFurtivo } from '../dados/ladino'
import { espacosDeMagia } from '../dados/magia'
import type {
  Arma,
  Armadura,
  Atributo,
  Classe,
  Habilidade,
  HabilidadeDeClasse,
  ItemInventario,
  Personagem,
  PericiaId,
  ValoresAtributos,
} from '../tipos'
import {
  ataqueMagia,
  bonusProficiencia,
  bonusTeste,
  capacidadeDeCarga,
  cdMagia,
  classeDeArmadura,
  modificador,
  percepcaoPassiva,
  pvMaximo,
  type GrauProficiencia,
} from './calculos'

export interface ValorAtributo {
  valor: number
  modificador: number
  base: number
  racial: number
  incrementos: number
}

export interface LinhaPericia {
  id: PericiaId
  nome: string
  atributo: Atributo
  bonus: number
  grau: GrauProficiencia
}

export interface Ataque {
  uid: string
  nome: string
  bonusAtaque: number
  dano: string
  danoVersatil: string | null
  tipoDano: string
  proficiente: boolean
  atributo: Atributo
  alcance: string
  propriedades: string[]
  furtivo: boolean
}

export interface HabilidadeNaFicha extends Habilidade {
  origem: string
}

export interface FichaCalculada {
  nivel: number
  proficiencia: number
  atributos: Record<Atributo, ValorAtributo>
  resistencias: Record<Atributo, { bonus: number; proficiente: boolean }>
  pericias: LinhaPericia[]
  percepcaoPassiva: number
  ca: { valor: number; descricao: string }
  iniciativa: number
  deslocamento: number
  pvMaximo: number
  dadoDeVida: number
  dadosDeVidaTotal: number
  dadosDeVidaRestantes: number
  ataques: Ataque[]
  ataqueFurtivo: string | null
  /** Bônus em testes com ferramentas de ladrão (Des + proficiência, dobrada com Especialização). */
  ferramentasDeLadrao: number | null
  habilidades: HabilidadeNaFicha[]
  proficiencias: { armaduras: string[]; armas: string[]; ferramentas: string[]; idiomas: string[] }
  conjuracao: { atributo: Atributo; cd: number; ataque: number; espacos: number[] } | null
  carga: { peso: number; capacidade: number; arrastar: number }
  avisos: string[]
}

const NOME_CATEGORIA_ARMADURA = {
  leve: 'Armaduras leves',
  media: 'Armaduras médias',
  pesada: 'Armaduras pesadas',
  escudo: 'Escudos',
} as const

export function somarAumentos(...fontes: Partial<ValoresAtributos>[]): ValoresAtributos {
  const total: ValoresAtributos = { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 }
  for (const fonte of fontes) {
    for (const { id } of ATRIBUTOS) total[id] += fonte[id] ?? 0
  }
  return total
}

/** Atributos finais: base + raça/sub-raça + incrementos (máximo 20 pelos incrementos). */
export function calcularAtributos(p: Personagem): Record<Atributo, ValorAtributo> {
  const raca = obterRaca(p.racaId)
  const subraca = obterSubraca(raca, p.subracaId)
  const racial = somarAumentos(raca.aumentos, subraca?.aumentos ?? {})
  const incrementos = somarAumentos(...p.incrementos.filter((i) => i.nivel <= p.nivel).map((i) => i.aumentos))
  const resultado = {} as Record<Atributo, ValorAtributo>
  for (const { id } of ATRIBUTOS) {
    const semIncremento = p.atributosBase[id] + racial[id]
    const valor = Math.max(semIncremento, Math.min(20, semIncremento + incrementos[id]))
    resultado[id] = {
      valor,
      modificador: modificador(valor),
      base: p.atributosBase[id],
      racial: racial[id],
      incrementos: valor - semIncremento,
    }
  }
  return resultado
}

/** Todas as perícias com proficiência: raça, sub-raça, antecedente e escolhas. */
export function periciasProficientes(p: Personagem): Set<PericiaId> {
  const raca = obterRaca(p.racaId)
  const subraca = obterSubraca(raca, p.subracaId)
  const antecedente = obterAntecedente(p.antecedenteId)
  return new Set<PericiaId>([
    ...raca.pericias,
    ...(subraca?.pericias ?? []),
    ...antecedente.pericias,
    ...p.periciasEscolhidas,
  ])
}

export function habilidadesDeClasseAte(classe: Classe, subclasseId: string | null, nivel: number): HabilidadeDeClasse[] {
  const subclasse = obterSubclasse(classe, subclasseId)
  return [...classe.habilidades, ...(subclasse?.habilidades ?? [])]
    .filter((h) => h.nivel <= nivel)
    .sort((a, b) => a.nivel - b.nivel)
}

function proficienteComArma(arma: Arma, classe: Classe, armasExtras: string[]): boolean {
  return (
    classe.armas.categorias.includes(arma.categoria) ||
    classe.armas.especificas.includes(arma.id) ||
    armasExtras.includes(arma.id)
  )
}

function formatarDano(dado: string, mod: number): string {
  if (mod === 0) return dado
  return `${dado}${mod > 0 ? '+' : '−'}${Math.abs(mod)}`
}

const NOME_PROPRIEDADE: Record<string, string> = {
  acuidade: 'acuidade',
  leve: 'leve',
  arremesso: 'arremesso',
  municao: 'munição',
  duasMaos: 'duas mãos',
  pesada: 'pesada',
  alcance: 'alcance',
  recarga: 'recarga',
  versatil: 'versátil',
}

export function calcularAtaque(
  item: ItemInventario,
  arma: Arma,
  atributos: Record<Atributo, ValorAtributo>,
  proficiencia: number,
  proficiente: boolean,
): Ataque {
  const modFor = atributos.for.modificador
  const modDes = atributos.des.modificador
  // Acuidade: o melhor entre Força e Destreza. À distância: Destreza. Corpo a corpo: Força.
  let atributo: Atributo
  if (arma.propriedades.includes('acuidade')) atributo = modDes >= modFor ? 'des' : 'for'
  else atributo = arma.alcance === 'distancia' ? 'des' : 'for'
  const mod = atributos[atributo].modificador
  const alcance = arma.distancia
    ? `${arma.alcance === 'corpo' ? '1,5 m ou ' : ''}${arma.distancia[0]}/${arma.distancia[1]} m`
    : arma.propriedades.includes('alcance')
      ? '3 m'
      : '1,5 m'
  return {
    uid: item.uid,
    nome: item.nome,
    bonusAtaque: mod + (proficiente ? proficiencia : 0),
    dano: formatarDano(arma.dano, mod),
    danoVersatil: arma.versatil ? formatarDano(arma.versatil, mod) : null,
    tipoDano: arma.tipoDano === 'concussao' ? 'concussão' : arma.tipoDano,
    proficiente,
    atributo,
    alcance: alcance.replace('.', ','),
    propriedades: arma.propriedades.map((x) => NOME_PROPRIEDADE[x] ?? x),
    furtivo: arma.propriedades.includes('acuidade') || arma.alcance === 'distancia',
  }
}

export function pesoTotal(inventario: ItemInventario[]): number {
  const total = inventario.reduce((soma, i) => soma + i.peso * i.quantidade, 0)
  return Math.round(total * 100) / 100
}

export function calcularFicha(p: Personagem): FichaCalculada {
  const raca = obterRaca(p.racaId)
  const subraca = obterSubraca(raca, p.subracaId)
  const classe = obterClasse(p.classeId)
  const subclasse = obterSubclasse(classe, p.subclasseId)
  const antecedente = obterAntecedente(p.antecedenteId)
  const avisos: string[] = []

  const nivel = p.nivel
  const prof = bonusProficiencia(nivel)
  const atributos = calcularAtributos(p)

  // Testes de resistência
  const resistenciasProf = new Set<Atributo>([
    ...classe.resistencias,
    ...(classe.resistenciasPorNivel ?? []).filter((r) => r.nivel <= nivel).map((r) => r.atributo),
  ])
  const resistencias = {} as FichaCalculada['resistencias']
  for (const { id } of ATRIBUTOS) {
    const proficiente = resistenciasProf.has(id)
    resistencias[id] = {
      proficiente,
      bonus: bonusTeste(atributos[id].modificador, prof, proficiente ? 1 : 0),
    }
  }

  // Perícias
  const proficientes = periciasProficientes(p)
  const pericias: LinhaPericia[] = PERICIAS.map((pericia) => {
    const especialista = p.especializacoes.includes(pericia.id) && proficientes.has(pericia.id)
    const grau: GrauProficiencia = especialista ? 2 : proficientes.has(pericia.id) ? 1 : 0
    return {
      id: pericia.id,
      nome: NOME_PERICIA[pericia.id],
      atributo: pericia.atributo,
      grau,
      bonus: bonusTeste(atributos[pericia.atributo].modificador, prof, grau),
    }
  })
  const percepcao = pericias.find((x) => x.id === 'percepcao')!

  // Armadura e CA
  const equipados = p.inventario.filter((i) => i.equipado && i.itemId)
  const armaduras = equipados
    .map((i) => buscarItem(i.itemId!))
    .filter((x): x is Armadura => x?.tipo === 'armadura')
  const armadura = armaduras.find((a) => a.categoria !== 'escudo') ?? null
  const escudo = armaduras.some((a) => a.categoria === 'escudo')
  const ca = classeDeArmadura(atributos.des.modificador, armadura, escudo)
  const descricaoCa = [armadura ? armadura.nome : 'Sem armadura', escudo ? 'escudo' : null]
    .filter(Boolean)
    .join(' + ')
  if (armadura && !classe.armaduras.includes(armadura.categoria)) {
    avisos.push(`Sem proficiência em ${armadura.nome}: desvantagem em testes e ataques de Força e Destreza.`)
  }
  if (escudo && !classe.armaduras.includes('escudo')) {
    avisos.push('Sem proficiência com escudo: desvantagem em testes e ataques de Força e Destreza.')
  }

  // Deslocamento
  let deslocamento = subraca?.deslocamento ?? raca.deslocamento
  if (armadura?.forcaMinima && atributos.for.valor < armadura.forcaMinima) {
    deslocamento -= 3
    avisos.push(`${armadura.nome} exige Força ${armadura.forcaMinima}: deslocamento reduzido em 3 m.`)
  }

  // Ataques: armas no inventário
  const armasExtras = [...raca.armas, ...(subraca?.armas ?? [])]
  const ataques: Ataque[] = []
  for (const item of p.inventario) {
    const catalogo = item.itemId ? buscarItem(item.itemId) : undefined
    if (catalogo?.tipo !== 'arma') continue
    ataques.push(
      calcularAtaque(item, catalogo, atributos, prof, proficienteComArma(catalogo, classe, armasExtras)),
    )
  }

  // Habilidades
  const habilidades: HabilidadeNaFicha[] = [
    ...raca.tracos.map((t) => ({ ...t, origem: raca.nome })),
    ...(subraca?.tracos ?? []).map((t) => ({ ...t, origem: subraca!.nome })),
    ...habilidadesDeClasseAte(classe, p.subclasseId, nivel).map((h) => ({
      ...h,
      origem: classe.habilidades.includes(h) ? `${classe.nome} ${h.nivel}º` : `${subclasse?.nome} ${h.nivel}º`,
    })),
    { ...antecedente.caracteristica, origem: antecedente.nome },
  ]

  // Proficiências gerais
  const ferramentasSubclasse = subclasse && nivel >= classe.nivelSubclasse ? subclasse.ferramentas : []
  const ferramentas = Array.from(
    new Set([...classe.ferramentas, ...antecedente.ferramentas, ...ferramentasSubclasse, ...p.ferramentasEscolhidas]),
  )
  const nomesArmas = [
    ...classe.armas.categorias.map((c) => (c === 'simples' ? 'Armas simples' : 'Armas marciais')),
    ...[...classe.armas.especificas, ...armasExtras].map((id) => buscarItem(id)?.nome ?? id),
  ]

  // Conjuração (classe ou subclasse)
  const fonteMagia = classe.conjuracao ?? (nivel >= classe.nivelSubclasse ? subclasse?.conjuracao : undefined)
  const conjuracao = fonteMagia
    ? {
        atributo: fonteMagia.atributo,
        cd: cdMagia(prof, atributos[fonteMagia.atributo].modificador),
        ataque: ataqueMagia(prof, atributos[fonteMagia.atributo].modificador),
        espacos: espacosDeMagia(fonteMagia.tipo, nivel),
      }
    : null

  const { carga: capacidade, arrastar } = capacidadeDeCarga(atributos.for.valor)
  const peso = pesoTotal(p.inventario)
  if (peso > capacidade) avisos.push('Carga acima da capacidade.')

  return {
    nivel,
    proficiencia: prof,
    atributos,
    resistencias,
    pericias,
    percepcaoPassiva: percepcaoPassiva(percepcao.bonus),
    ca: { valor: ca, descricao: descricaoCa },
    iniciativa: atributos.des.modificador,
    deslocamento,
    pvMaximo: pvMaximo(classe.dadoDeVida, atributos.con.modificador, p.pvPorNivel.slice(0, nivel - 1)),
    dadoDeVida: classe.dadoDeVida,
    dadosDeVidaTotal: nivel,
    dadosDeVidaRestantes: Math.max(0, nivel - p.estado.dadosDeVidaGastos),
    ataques,
    ferramentasDeLadrao: ferramentas.includes('Ferramentas de ladrão')
      ? bonusTeste(atributos.des.modificador, prof, p.especializacoes.includes('ferramentasDeLadrao') ? 2 : 1)
      : null,
    ataqueFurtivo: classe.id === 'ladino' ? `${dadosAtaqueFurtivo(nivel)}d6` : null,
    habilidades,
    proficiencias: {
      armaduras: classe.armaduras.map((c) => NOME_CATEGORIA_ARMADURA[c]),
      armas: Array.from(new Set(nomesArmas)),
      ferramentas,
      idiomas: [...raca.idiomas, ...p.idiomasEscolhidos],
    },
    conjuracao,
    carga: { peso, capacidade, arrastar },
    avisos,
  }
}
