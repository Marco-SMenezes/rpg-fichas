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
import { dadosSopro } from '../dados/racas'
import { espacosDeMagia } from '../dados/magia'
import { MAGIA_POR_ID } from '../dados/magias'
import { CONDICAO_POR_ID, EXAUSTAO } from '../dados/condicoes'
import { aumentosDoTalento, descricaoDoTalento, efeitosDosTalentos, talentosDe } from './talentos'
import type {
  Arma,
  Armadura,
  Atributo,
  Classe,
  ContextoClasse,
  EstiloDeLuta,
  Habilidade,
  Recurso,
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
  /** Nível de exaustão (0 a 6). */
  exaustao: number
  /** Quantas magias vêm de talentos (o bloco de Magias aparece mesmo sem conjuração de classe). */
  magiasDeTalento: number
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
  conjuracao: {
    atributo: Atributo
    cd: number
    ataque: number
    espacos: number[]
    /** Quantas magias prepara por dia (clérigo, druida, mago, paladino). */
    preparadas: number | null
    /** Quantas magias conhece (bardo, bruxo, feiticeiro, patrulheiro). */
    conhecidas: number | null
    truques: number | null
  } | null
  recursos: (Recurso & { gastos: number })[]
  extras: { nome: string; valor: string }[]
  ataquesPorAcao: number
  margemCritico: number
  estilosDeLuta: EstiloDeLuta[]
  resistenciasDano: string[]
  visaoNoEscuro: number | null
  /** Arma de sopro do draconato. */
  sopro: { dano: string; tipo: string; area: string; teste: Atributo; cd: number } | null
  tamanho: 'Pequeno' | 'Médio'
  carga: { peso: number; capacidade: number; arrastar: number }
  avisos: string[]
}

const NOME_ABREV: Record<Atributo, string> = { for: 'For', des: 'Des', con: 'Con', int: 'Int', sab: 'Sab', car: 'Car' }

export const NOME_CATEGORIA_ARMADURA = {
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

/** Tudo o que raça e sub-raça dão, já somado com as escolhas raciais do jogador. */
export function mecanicasRaciais(p: Personagem) {
  const raca = obterRaca(p.racaId)
  const subraca = obterSubraca(raca, p.subracaId)
  const fontes = [raca, ...(subraca ? [subraca] : [])]
  const escolhas = p.escolhasRaciais ?? { aumentos: [], pericias: [], ferramenta: '', ancestral: '' }
  const ancestral = raca.ancestrais?.find((a) => a.id === escolhas.ancestral) ?? null
  const limiteAumentos = fontes.reduce((n, x) => n + (x.aumentosEscolha?.quantidade ?? 0), 0)
  const excluidos = fontes.flatMap((x) => x.aumentosEscolha?.excluir ?? [])
  const aumentosEscolhidos = Array.from(new Set(escolhas.aumentos))
    .filter((a) => !excluidos.includes(a))
    .slice(0, limiteAumentos)
  const limitePericias = fontes.reduce((n, x) => n + (x.periciasEscolha ?? 0), 0)
  return {
    raca,
    subraca,
    ancestral,
    aumentos: somarAumentos(
      ...fontes.map((x) => x.aumentos),
      Object.fromEntries(aumentosEscolhidos.map((a) => [a, 1])),
      raca.talento ? aumentosDoTalento(escolhas.talento) : {},
    ),
    pericias: [...fontes.flatMap((x) => x.pericias), ...escolhas.pericias.slice(0, limitePericias)],
    armas: fontes.flatMap((x) => x.armas),
    armaduras: fontes.flatMap((x) => x.armaduras ?? []),
    ferramentas: [
      ...fontes.flatMap((x) => x.ferramentas ?? []),
      ...(fontes.some((x) => x.escolhaFerramenta) && escolhas.ferramenta ? [escolhas.ferramenta] : []),
    ],
    resistenciasDano: [...fontes.flatMap((x) => x.resistenciasDano ?? []), ...(ancestral ? [ancestral.dano] : [])],
    visaoNoEscuro: subraca?.visaoNoEscuro ?? raca.visaoNoEscuro ?? null,
    pvPorNivel: fontes.reduce((n, x) => n + (x.pvPorNivel ?? 0), 0),
    deslocamento: subraca?.deslocamento ?? raca.deslocamento,
  }
}

/** Classe e subclasse (se já alcançada) com as regras que valem neste nível. */
export function regrasAtivas(p: Personagem) {
  const classe = obterClasse(p.classeId)
  const subclasse = p.nivel >= classe.nivelSubclasse ? obterSubclasse(classe, p.subclasseId) : null
  return [classe, ...(subclasse ? [subclasse] : [])] as const
}

export function estilosDeLuta(p: Personagem): EstiloDeLuta[] {
  return Object.entries(p.escolhasDeClasse ?? {})
    .filter(([k]) => k.startsWith('estiloDeLuta'))
    .map(([, v]) => v as EstiloDeLuta)
}

/** Atributos finais: base + raça/sub-raça + incrementos (máximo 20 pelos incrementos). */
export function calcularAtributos(p: Personagem): Record<Atributo, ValorAtributo> {
  const racial = mecanicasRaciais(p).aumentos
  const aumentoDeClasse = obterClasse(p.classeId).aumentosDeClasse?.(p.nivel) ?? null
  const incrementos = somarAumentos(
    ...p.incrementos.filter((i) => i.nivel <= p.nivel).map((i) => (i.talento ? aumentosDoTalento(i.talento) : i.aumentos)),
  )
  const resultado = {} as Record<Atributo, ValorAtributo>
  for (const { id } of ATRIBUTOS) {
    const semIncremento = p.atributosBase[id] + racial[id]
    let valor = Math.max(semIncremento, Math.min(20, semIncremento + incrementos[id]))
    const deClasse = aumentoDeClasse?.aumentos[id]
    if (deClasse) valor = Math.max(valor, Math.min(aumentoDeClasse!.maximo, valor + deClasse))
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
  const antecedente = obterAntecedente(p.antecedenteId)
  const c = { nivel: p.nivel, escolhas: p.escolhasDeClasse ?? {} }
  return new Set<PericiaId>([
    ...mecanicasRaciais(p).pericias,
    ...antecedente.pericias,
    ...p.periciasEscolhidas,
    ...regrasAtivas(p).flatMap((r) => r.periciasExtras?.(c) ?? []),
    ...efeitosDosTalentos(p).pericias,
  ])
}

/** Especializações: as escolhidas (ladino, bardo) e as que vêm de escolhas da subclasse. */
export function especializacoesDe(p: Personagem): Set<string> {
  const c = { nivel: p.nivel, escolhas: p.escolhasDeClasse ?? {} }
  return new Set<string>([...p.especializacoes, ...regrasAtivas(p).flatMap((r) => r.especializacoesExtras?.(c) ?? [])])
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

/** O maior entre dois dados ('1d6' x '1d8'), pela média. */
function maiorDado(a: string, b: string): string {
  const media = (d: string) => {
    const [q, l] = d.split('d').map(Number)
    return (q ?? 1) * ((l ?? 0) + 1) / 2
  }
  return media(b) > media(a) ? b : a
}

function somarAoDano(dano: string, extra: number): string {
  const m = /^(.*?)(?:([+−])(\d+))?$/.exec(dano)!
  const atual = m[3] ? (m[2] === '−' ? -1 : 1) * Number(m[3]) : 0
  return formatarDano(m[1]!, atual + extra)
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
  const racial = mecanicasRaciais(p)
  const { raca, subraca } = racial
  const classe = obterClasse(p.classeId)
  const subclasse = obterSubclasse(classe, p.subclasseId)
  const antecedente = obterAntecedente(p.antecedenteId)
  const avisos: string[] = []

  const nivel = p.nivel
  const prof = bonusProficiencia(nivel)
  const atributos = calcularAtributos(p)
  const talentos = efeitosDosTalentos(p)

  // Testes de resistência
  const resistenciasProf = new Set<Atributo>([
    ...classe.resistencias,
    ...(classe.resistenciasPorNivel ?? []).filter((r) => r.nivel <= nivel).map((r) => r.atributo),
    ...regrasAtivas(p).flatMap((r) => r.resistenciasExtras ?? []).filter((r) => r.nivel <= nivel).map((r) => r.atributo),
    ...talentos.resistencias,
  ])
  const resistencias = {} as FichaCalculada['resistencias']
  const ctxResistencias: ContextoClasse = {
    nivel,
    proficiencia: prof,
    mod: Object.fromEntries(ATRIBUTOS.map(({ id }) => [id, atributos[id].modificador])) as Record<Atributo, number>,
    escolhas: p.escolhasDeClasse ?? {},
  }
  const bonusResist = regrasAtivas(p).reduce((n, r) => n + (r.bonusResistencias?.(ctxResistencias) ?? 0), 0)
  for (const { id } of ATRIBUTOS) {
    const proficiente = resistenciasProf.has(id)
    resistencias[id] = {
      proficiente,
      bonus: bonusTeste(atributos[id].modificador, prof, proficiente ? 1 : 0) + bonusResist,
    }
  }

  // Perícias
  const proficientes = periciasProficientes(p)
  const meiaProf = regrasAtivas(p).some((r) => r.meiaProficiencia?.(nivel)) ? Math.floor(prof / 2) : 0
  const especializacoes = especializacoesDe(p)
  const pericias: LinhaPericia[] = PERICIAS.map((pericia) => {
    const especialista = especializacoes.has(pericia.id) && proficientes.has(pericia.id)
    const grau: GrauProficiencia = especialista ? 2 : proficientes.has(pericia.id) ? 1 : 0
    return {
      id: pericia.id,
      nome: NOME_PERICIA[pericia.id],
      atributo: pericia.atributo,
      grau,
      bonus: bonusTeste(atributos[pericia.atributo].modificador, prof, grau) + (grau === 0 ? meiaProf : 0),
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
  const regras = regrasAtivas(p)
  const estilos = estilosDeLuta(p)
  const ctx: ContextoClasse = {
    nivel,
    proficiencia: prof,
    mod: Object.fromEntries(ATRIBUTOS.map(({ id }) => [id, atributos[id].modificador])) as Record<Atributo, number>,
    escolhas: p.escolhasDeClasse ?? {},
  }
  let ca = classeDeArmadura(atributos.des.modificador, armadura, escudo, talentos.desMaxArmaduraMedia || undefined)
  let descricaoCa = [armadura ? armadura.nome : 'Sem armadura', escudo ? 'escudo' : null].filter(Boolean).join(' + ')
  if (!armadura) {
    for (const r of regras) {
      const d = r.defesaSemArmadura
      if (!d || (escudo && !d.permiteEscudo)) continue
      const valor = (d.base ?? 10) + atributos.des.modificador + (d.atributo ? atributos[d.atributo].modificador : 0) + (escudo ? 2 : 0)
      if (valor > ca) {
        ca = valor
        descricaoCa = `Defesa sem armadura (${d.base ?? 10} + Des${d.atributo ? ` + ${NOME_ABREV[d.atributo]}` : ''})${escudo ? ' + escudo' : ''}`
      }
    }
  }
  if (armadura && estilos.includes('defesa')) {
    ca += 1
    descricaoCa += ' + Defesa'
  }
  const armadurasProficientes = Array.from(
    new Set([...classe.armaduras, ...racial.armaduras, ...regras.flatMap((r) => r.armaduras ?? []), ...talentos.armaduras]),
  )
  if (armadura && !armadurasProficientes.includes(armadura.categoria)) {
    avisos.push(`Sem proficiência em ${armadura.nome}: desvantagem em testes e ataques de Força e Destreza.`)
  }
  if (escudo && !armadurasProficientes.includes('escudo')) {
    avisos.push('Sem proficiência com escudo: desvantagem em testes e ataques de Força e Destreza.')
  }

  // Deslocamento
  let deslocamento = racial.deslocamento + talentos.deslocamento
  if (armadura?.forcaMinima && atributos.for.valor < armadura.forcaMinima && !raca.ignoraForcaArmadura) {
    deslocamento -= 3
    avisos.push(`${armadura.nome} exige Força ${armadura.forcaMinima}: deslocamento reduzido em 3 m.`)
  }

  // Escolhas que pedem uma magia conhecida (ex.: Explosão Agonizante pede rajada mística).
  const conhecidas = new Set(p.magias.map((x) => x.id))
  for (const r of regrasAtivas(p)) {
    for (const e of r.escolhas ?? []) {
      const o = e.opcoes.find((x) => x.id === p.escolhasDeClasse?.[e.id])
      if (o?.exigeMagia && !conhecidas.has(o.exigeMagia)) {
        avisos.push(`${o.nome} precisa da magia ${MAGIA_POR_ID[o.exigeMagia]?.nome ?? o.exigeMagia}: escolha-a em Magias.`)
      }
    }
  }

  for (const r of regras) {
    const extra = r.deslocamentoExtra?.(nivel)
    if (!extra || !extra.metros) continue
    const permitido = extra.semArmadura === 'pesada' ? armadura?.categoria !== 'pesada' : !armadura && !escudo
    if (permitido) deslocamento += extra.metros
  }

  // Exaustão e condições (LdJ p. 291–292)
  const exaustao = p.estado.exaustao ?? 0
  const condicoesAtivas = (p.estado.condicoes ?? []).map((id) => CONDICAO_POR_ID[id]).filter((c) => !!c)
  if (exaustao >= 5) deslocamento = 0
  else if (exaustao >= 2) deslocamento = deslocamento / 2
  const parado = condicoesAtivas.find((c) => c.paraDeslocamento)
  if (parado) deslocamento = 0
  if (exaustao > 0) avisos.push(`Exaustão ${exaustao}: ${EXAUSTAO.slice(1, exaustao + 1).join(' ')}`)
  if (parado) avisos.push(`${parado.nome}: deslocamento 0.`)

  // Ataques: armas no inventário
  const armasExtras = [...racial.armas, ...talentos.armas]
  const ataques: Ataque[] = []
  for (const item of p.inventario) {
    const catalogo = item.itemId ? buscarItem(item.itemId) : undefined
    if (catalogo?.tipo !== 'arma') continue
    const artesDoNivel = regras.map((r) => r.artesMarciais?.(nivel)).find(Boolean)
    const armaDeMonge =
      !!artesDoNivel &&
      (catalogo.id === 'espadaCurta' ||
        (catalogo.categoria === 'simples' && catalogo.alcance === 'corpo' && !catalogo.propriedades.some((x) => x === 'duasMaos' || x === 'pesada')))
    const categoriasExtras = regras.flatMap((r) => r.armasCategorias ?? [])
    const ataque = calcularAtaque(
      item,
      armaDeMonge ? { ...catalogo, propriedades: [...catalogo.propriedades, 'acuidade'], dano: maiorDado(catalogo.dano, artesDoNivel!) } : catalogo,
      atributos,
      prof,
      proficienteComArma(catalogo, classe, armasExtras) || categoriasExtras.includes(catalogo.categoria),
    )
    // Estilos de luta (LdJ p. 85): Arquearia +2 no ataque à distância; Duelismo +2 no dano com arma de uma mão.
    if (estilos.includes('arquearia') && catalogo.alcance === 'distancia') ataque.bonusAtaque += 2
    if (estilos.includes('duelismo') && catalogo.alcance === 'corpo' && !catalogo.propriedades.includes('duasMaos')) {
      ataque.dano = somarAoDano(ataque.dano, 2)
    }
    ataques.push(ataque)
  }
  const artes = regras.map((r) => r.artesMarciais?.(nivel)).find(Boolean)
  if (artes) {
    const atributo: Atributo = atributos.des.modificador >= atributos.for.modificador ? 'des' : 'for'
    const mod = atributos[atributo].modificador
    ataques.unshift({
      uid: 'desarmado',
      nome: 'Ataque desarmado',
      bonusAtaque: mod + prof,
      dano: formatarDano(artes, mod),
      danoVersatil: null,
      tipoDano: 'concussão',
      proficiente: true,
      atributo,
      alcance: '1,5 m',
      propriedades: ['artes marciais'],
      furtivo: false,
    })
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
    ...talentosDe(p).map(({ talento, escolhas, origem }) => ({
      id: `talento-${talento.id}-${origem}`,
      nome: talento.nome,
      pagina: talento.pagina,
      resumo: descricaoDoTalento(talento, escolhas),
      origem: origem === 'raça' ? 'Talento (raça)' : `Talento ${origem}º`,
    })),
  ]

  // Proficiências gerais
  const ferramentasSubclasse = subclasse && nivel >= classe.nivelSubclasse ? subclasse.ferramentas : []
  const ferramentas = Array.from(
    new Set([
      ...classe.ferramentas,
      ...antecedente.ferramentas,
      ...ferramentasSubclasse,
      ...racial.ferramentas,
      ...p.ferramentasEscolhidas,
      ...Object.entries(p.escolhasDeClasse ?? {})
        .filter(([k, v]) => v && (k === 'ferramenta' || k.startsWith('instrumento')))
        .map(([, v]) => v),
    ]),
  )
  const nomesArmas = [
    ...Array.from(new Set([...classe.armas.categorias, ...regrasAtivas(p).flatMap((r) => r.armasCategorias ?? [])])).map((c) =>
      c === 'simples' ? 'Armas simples' : 'Armas marciais',
    ),
    ...[...classe.armas.especificas, ...armasExtras].map((id) => buscarItem(id)?.nome ?? id),
  ]

  // Conjuração (classe ou subclasse)
  const fonteMagia = classe.conjuracao ?? (nivel >= classe.nivelSubclasse ? subclasse?.conjuracao : undefined)
  const fonteDeMagias = classe.magias ?? (nivel >= classe.nivelSubclasse ? subclasse?.magias : undefined)
  const conjuracao = fonteMagia
    ? {
        atributo: fonteMagia.atributo,
        cd: cdMagia(prof, atributos[fonteMagia.atributo].modificador),
        ataque: ataqueMagia(prof, atributos[fonteMagia.atributo].modificador),
        espacos: espacosDeMagia(fonteMagia.tipo, nivel),
        preparadas: fonteDeMagias?.preparadas?.(ctx) ?? null,
        conhecidas: (() => {
          const base = fonteDeMagias?.conhecidas?.[nivel - 1]
          if (base === undefined) return null
          // Segredos Mágicos Adicionais (Colégio do Conhecimento) ficam além do limite.
          return base + regrasAtivas(p).reduce((n, r) => n + (r.segredosMagicos?.(nivel).alemDoLimite ?? 0), 0)
        })(),
        truques: fonteDeMagias?.truques?.[nivel - 1] ?? null,
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
    percepcaoPassiva: percepcaoPassiva(percepcao.bonus) + talentos.passivas,
    ca: { valor: ca, descricao: descricaoCa },
    iniciativa: atributos.des.modificador + talentos.iniciativa,
    deslocamento,
    exaustao,
    magiasDeTalento: talentosDe(p).reduce((n, t) => n + (t.talento.magias?.(t.escolhas).length ?? 0), 0),
    pvMaximo: (exaustao >= 4 ? (x: number) => Math.floor(x / 2) : (x: number) => x)(
      pvMaximo(classe.dadoDeVida, atributos.con.modificador, p.pvPorNivel.slice(0, nivel - 1)) +
      (racial.pvPorNivel + talentos.pvPorNivel + regras.reduce((n, r) => n + (r.pvPorNivel ?? 0), 0)) * nivel,
    ),
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
      armaduras: armadurasProficientes.map((c) => NOME_CATEGORIA_ARMADURA[c]),
      armas: Array.from(new Set(nomesArmas)),
      ferramentas,
      idiomas: Array.from(
        new Set([...raca.idiomas, ...p.idiomasEscolhidos, ...regras.flatMap((r) => r.idiomasExtras?.(ctx) ?? []), ...talentos.idiomas]),
      ),
    },
    conjuracao,
    recursos: [...regras.flatMap((r) => r.recursos?.(ctx) ?? []), ...talentos.recursos].map((r) => ({ ...r, gastos: Math.min(p.estado.recursosGastos?.[r.id] ?? 0, r.maximo ?? Infinity) })),
    extras: regras.flatMap((r) => r.extras?.(ctx) ?? []),
    ataquesPorAcao: Math.max(1, ...regras.map((r) => r.ataquesPorAcao?.(nivel) ?? 1)),
    margemCritico: Math.min(20, ...regras.map((r) => r.margemCritico?.(nivel) ?? 20)),
    estilosDeLuta: estilos,
    resistenciasDano: Array.from(new Set(racial.resistenciasDano)),
    visaoNoEscuro: racial.visaoNoEscuro,
    sopro: racial.ancestral
      ? {
          dano: `${dadosSopro(nivel)}d6`,
          tipo: racial.ancestral.dano,
          area: racial.ancestral.area,
          teste: racial.ancestral.teste,
          cd: 8 + atributos.con.modificador + prof,
        }
      : null,
    tamanho: raca.tamanho,
    carga: { peso, capacidade, arrastar },
    avisos,
  }
}
