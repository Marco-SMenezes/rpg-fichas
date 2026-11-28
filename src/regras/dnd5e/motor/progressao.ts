/** Ficha em jogo: dano, cura, descansos e subida de nível. Tudo imutável. */
import { obterClasse } from '../dados'
import { criarPersonagem, type EscolhasDeCriacao } from './criacao'
import type {
  EscolhaDeClasse,
  Especializavel,
  OpcaoDeEscolha,
  Talento,
  TalentoEscolhido,
  EstadoDeJogo,
  Incremento,
  Personagem,
  ValoresAtributos,
} from '../tipos'
import { dadosDeVidaRecuperados, pvMedioPorNivel } from './calculos'
import { calcularAtributos, calcularFicha, NOME_CATEGORIA_ARMADURA, regrasAtivas } from './ficha'
import { talentosDe } from './talentos'
import { TALENTO_POR_ID } from '../dados/talentos'
import { MAGIA_POR_ID } from '../dados/magias'

function comEstado(p: Personagem, estado: Partial<EstadoDeJogo>): Personagem {
  return { ...p, estado: { ...p.estado, ...estado } }
}

/**
 * Dano tira primeiro dos PV temporários (LdJ p. 200).
 * Com 0 PV, cada dano é uma falha contra a morte (2 se for crítico); se o que
 * sobra depois de zerar os PV chega ao PV máximo, é morte instantânea (LdJ p. 199).
 */
export function aplicarDano(p: Personagem, dano: number, critico = false): Personagem {
  const valor = Math.max(0, Math.floor(dano))
  const doTemporario = Math.min(p.estado.pvTemporario, valor)
  const restante = valor - doTemporario
  const morte = { ...p.estado.morte }
  if (restante > 0 && p.estado.pvAtual === 0) morte.falhas = Math.min(3, morte.falhas + (critico ? 2 : 1))
  const sobra = restante - p.estado.pvAtual
  if (restante > 0 && sobra >= calcularFicha(p).pvMaximo) morte.falhas = 3
  return comEstado(p, {
    pvTemporario: p.estado.pvTemporario - doTemporario,
    pvAtual: Math.max(0, p.estado.pvAtual - restante),
    morte,
  })
}

/**
 * Mexer na vida com + e −: diminuir é dano (tira primeiro dos temporários);
 * aumentar cura até o máximo, e o que passar do máximo vira PV temporário.
 */
export function ajustarPV(p: Personagem, delta: number): Personagem {
  const d = Math.trunc(delta)
  if (d < 0) return aplicarDano(p, -d)
  if (d === 0) return p
  const max = calcularFicha(p).pvMaximo
  const cura = Math.min(d, Math.max(0, max - p.estado.pvAtual))
  const curado = cura > 0 ? curar(p, cura) : p
  const sobra = d - cura
  return sobra > 0 ? comEstado(curado, { pvTemporario: curado.estado.pvTemporario + sobra }) : curado
}

/** Vida mostrada (atuais + temporários) digitada direto: vira dano, cura ou temporários. */
export function definirVidaTotal(p: Personagem, total: number): Personagem {
  return ajustarPV(p, Math.max(0, Math.floor(total)) - (p.estado.pvAtual + p.estado.pvTemporario))
}

/* ---------- Testes contra a morte (LdJ p. 199) ---------- */

export type SituacaoDaMorte = 'consciente' | 'morrendo' | 'estavel' | 'morto'

export function situacaoDaMorte(p: Personagem): SituacaoDaMorte {
  const { sucessos, falhas } = p.estado.morte
  if (falhas >= 3) return 'morto'
  if (p.estado.pvAtual > 0) return 'consciente'
  return sucessos >= 3 ? 'estavel' : 'morrendo'
}

/**
 * Três sucessos estabilizam. A regra manda a pessoa voltar com 1 PV em 1d4 horas (LdJ p. 199); como o Tomo não conta
 * o tempo, a vida volta na hora: 1 PV e os testes zerados. Quem já tem três falhas não volta.
 */
function estabilizar(p: Personagem): Personagem {
  const { sucessos, falhas } = p.estado.morte
  if (p.estado.pvAtual > 0 || falhas >= 3 || sucessos < 3) return p
  return comEstado(p, { pvAtual: 1, morte: { sucessos: 0, falhas: 0 } })
}

/** Resultado do d20: 10 ou mais é sucesso, 1 conta duas falhas, 20 devolve 1 PV. O terceiro sucesso devolve 1 PV. */
export function salvamentoContraMorte(p: Personagem, d20: number): Personagem {
  if (situacaoDaMorte(p) !== 'morrendo') return p
  if (d20 >= 20) return comEstado(p, { pvAtual: 1, morte: { sucessos: 0, falhas: 0 } })
  const { sucessos, falhas } = p.estado.morte
  if (d20 <= 1) return comEstado(p, { morte: { sucessos, falhas: Math.min(3, falhas + 2) } })
  return estabilizar(comEstado(p, { morte: d20 >= 10 ? { sucessos: sucessos + 1, falhas } : { sucessos, falhas: falhas + 1 } }))
}

/** Marca à mão (ex.: o Mestre rolou): quantidade de sucessos ou falhas, de 0 a 3. */
export function marcarMorte(p: Personagem, tipo: 'sucessos' | 'falhas', quantidade: number): Personagem {
  return estabilizar(comEstado(p, { morte: { ...p.estado.morte, [tipo]: Math.max(0, Math.min(3, quantidade)) } }))
}

/* ---------- Condições, exaustão e concentração ---------- */

export function alternarCondicao(p: Personagem, id: string): Personagem {
  const atuais = p.estado.condicoes ?? []
  return comEstado(p, { condicoes: atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id] })
}

export function definirExaustao(p: Personagem, nivel: number): Personagem {
  return comEstado(p, { exaustao: Math.max(0, Math.min(6, Math.floor(nivel))) })
}

/** Começar outra magia de concentração encerra a anterior (LdJ p. 205). */
export function iniciarConcentracao(p: Personagem, magia: string): Personagem {
  return comEstado(p, { concentracao: magia })
}

export function encerrarConcentracao(p: Personagem): Personagem {
  return comEstado(p, { concentracao: null })
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
  const cura = rolagens.slice(0, gastos).reduce((total, r) => total + Math.max(0, r + ficha.atributos.con.modificador), 0)
  const curado = curar(p, cura)
  const curtos = new Set(ficha.recursos.filter((r) => r.recarga === 'curto').map((r) => r.id))
  const recursosGastos = Object.fromEntries(Object.entries(p.estado.recursosGastos ?? {}).filter(([id]) => !curtos.has(id)))
  // Magia de pacto (bruxo): os espaços voltam no descanso curto.
  const pacto = obterClasse(p.classeId).conjuracao?.tipo === 'pacto'
  return comEstado(curado, {
    dadosDeVidaGastos: p.estado.dadosDeVidaGastos + gastos,
    recursosGastos,
    ...(pacto ? { espacosGastos: [] } : {}),
  })
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
    // Um descanso longo tira um nível de exaustão (LdJ p. 292).
    exaustao: Math.max(0, (p.estado.exaustao ?? 0) - 1),
    concentracao: null,
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
  /** Trocas opcionais permitidas neste nível (uma por série). */
  trocas: TrocaPermitida[]
}

export interface TrocaPermitida {
  prefixo: string
  nome: string
  pagina: EscolhaDeClasse['pagina']
  opcoes: EscolhaDeClasse['opcoes']
}

export function requisitosDoProximoNivel(p: Personagem): RequisitosDeNivel | null {
  if (p.nivel >= 20) return null
  return requisitosDoNivel(p.classeId, p.nivel + 1, p.subclasseId)
}

/** O que a classe pede ao chegar em `novoNivel` (2 a 20). */
export function requisitosDoNivel(classeId: string, novoNivel: number, subclasseId: string | null = null): RequisitosDeNivel {
  const classe = obterClasse(classeId)
  const subclasse = classe.subclasses.find((s) => s.id === subclasseId)
  const todas = [...(classe.escolhas ?? []), ...(subclasse?.escolhas ?? [])]
  return {
    escolhas: todas.filter((e) => e.nivel === novoNivel),
    trocas: [...(classe.trocas ?? []), ...(subclasse?.trocas ?? [])]
      .filter((t) => t.niveis.includes(novoNivel))
      .map((t) => ({
        prefixo: t.prefixo,
        nome: t.nome,
        pagina: t.pagina,
        opcoes: todas.find((e) => e.id.replace(/\d+$/, '') === t.prefixo)?.opcoes ?? [],
      })),
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
  /** Talento no lugar do incremento (regra opcional). */
  talento?: TalentoEscolhido
  especializacoes?: Especializavel[]
  escolhas?: Record<string, string>
  /** Troca opcional por série: `sai` é o id da vaga (ex.: manobra2), `entra` a nova opção. */
  trocas?: Record<string, { sai: string; entra: string }>
  /** Ids das magias que a ficha terá ao fim deste nível, para conferir requisitos de magia (Lança Mística pede Rajada Mística). Sem isso vale a lista atual da ficha. */
  magias?: string[]
}

/** Incremento válido: +2 em um atributo ou +1 em dois, sem passar de 20 (LdJ p. 91). */
export function incrementoValido(aumentos: Partial<ValoresAtributos>): boolean {
  const valores = Object.values(aumentos).filter((v): v is number => !!v)
  const soma = valores.reduce((a, b) => a + b, 0)
  return soma === 2 && valores.every((v) => v === 1 || v === 2)
}

/**
 * Por que a opção não pode ser escolhida numa escolha feita em `nivel`
 * (nível exigido, outra escolha exigida, como o pacto, ou uma magia que a ficha precisa ter). `null` se pode.
 * `magias` são os ids das magias que a ficha tem (ou vai ter ao confirmar).
 */
export function motivoDeBloqueio(o: OpcaoDeEscolha, nivel: number, escolhas: Record<string, string>, magias: string[] = []): string | null {
  if ((o.nivelMinimo ?? 0) > nivel) return `Requer ${o.nivelMinimo}º nível.`
  const e = o.exigeEscolha
  if (e && (nivel < e.nivel || escolhas[e.id] !== e.valor)) return `Requer ${e.nome}.`
  if (o.exigeMagia && !magias.includes(o.exigeMagia)) return `Requer o truque ${MAGIA_POR_ID[o.exigeMagia]?.nome ?? o.exigeMagia}.`
  return null
}

/**
 * As magias que uma opção já escolhida exige (id da magia → nome da opção). Essas magias
 * não podem ser desmarcadas enquanto a opção continuar escolhida.
 */
export function magiasTravadas(
  classeId: string,
  subclasseId: string | null,
  nivel: number,
  escolhas: Record<string, string>,
): Record<string, string> {
  const classe = obterClasse(classeId)
  const sub = nivel >= classe.nivelSubclasse ? (classe.subclasses.find((s) => s.id === subclasseId) ?? null) : null
  const travadas: Record<string, string> = {}
  for (const e of [...(classe.escolhas ?? []), ...(sub?.escolhas ?? [])]) {
    const o = e.opcoes.find((x) => x.id === escolhas[e.id])
    if (o?.exigeMagia && e.nivel <= nivel) travadas[o.exigeMagia] = o.nome
  }
  return travadas
}

/**
 * Primeira opção ainda livre para uma escolha (sem repetir a mesma lista e
 * respeitando o nível exigido). Útil para preencher padrões e nos testes.
 */
export function primeiraOpcaoLivre(e: EscolhaDeClasse, escolhasAteAgora: Record<string, string>, magias: string[] = []): string | undefined {
  const prefixo = e.id.replace(/\d+$/, '')
  const usadas = new Set(
    Object.entries(escolhasAteAgora)
      .filter(([k]) => k !== e.id && k.replace(/\d+$/, '') === prefixo)
      .map(([, v]) => v),
  )
  return e.opcoes.find((o) => !usadas.has(o.id) && !motivoDeBloqueio(o, e.nivel, escolhasAteAgora, magias))?.id
}

export function subirDeNivel(p: Personagem, escolhas: EscolhasDeNivel): Personagem {
  const req = requisitosDoProximoNivel(p)
  if (!req) throw new Error('Nível máximo atingido.')
  if (escolhas.pv < 1 || escolhas.pv > req.dadoDeVida) throw new Error('Resultado do dado de vida inválido.')
  if (req.escolherSubclasse && !escolhas.subclasseId) throw new Error('Escolha o arquétipo.')
  if (req.incremento && escolhas.talento) {
    const erro = problemaNoTalento(p, escolhas.talento)
    if (erro) throw new Error(erro)
  } else if (req.incremento && (!escolhas.incremento || !incrementoValido(escolhas.incremento))) {
    throw new Error('Incremento de atributo inválido.')
  }
  if (req.especializacoes && (escolhas.especializacoes?.length ?? 0) !== req.especializacoes) {
    throw new Error(`Escolha ${req.especializacoes} especializações.`)
  }

  const magiasDaFicha = escolhas.magias ?? p.magias.map((m) => m.id)
  const reqComSubclasse = requisitosDoNivel(p.classeId, req.novoNivel, req.escolherSubclasse ? (escolhas.subclasseId ?? null) : p.subclasseId)
  for (const e of reqComSubclasse.escolhas) {
    const valor = escolhas.escolhas?.[e.id]
    const opcao = e.opcoes.find((o) => o.id === valor)
    if (!opcao) throw new Error(`Escolha: ${e.rotulo}.`)
    const motivo = motivoDeBloqueio(opcao, req.novoNivel, { ...p.escolhasDeClasse, ...escolhas.escolhas }, magiasDaFicha)
    if (motivo) throw new Error(`${e.rotulo}: ${opcao.nome}. ${motivo}`)
    const prefixo = e.id.replace(/\d+$/, '')
    const repetida = Object.entries({ ...p.escolhasDeClasse, ...escolhas.escolhas }).some(
      ([k, v]) => k !== e.id && k.replace(/\d+$/, '') === prefixo && v === valor,
    )
    if (repetida) throw new Error(`${e.rotulo}: essa opção já foi escolhida.`)
  }

  const novasEscolhas = { ...p.escolhasDeClasse, ...escolhas.escolhas }
  for (const [prefixo, { sai, entra }] of Object.entries(escolhas.trocas ?? {})) {
    if (!sai || !entra) continue
    const permitida = reqComSubclasse.trocas.find((t) => t.prefixo === prefixo)
    if (!permitida) throw new Error(`Neste nível não dá para trocar ${prefixo}.`)
    if (!p.escolhasDeClasse[sai] || sai.replace(/\d+$/, '') !== prefixo) throw new Error(`Troca de ${permitida.nome}: escolha qual sai.`)
    const opcao = permitida.opcoes.find((o) => o.id === entra)
    if (!opcao) throw new Error(`Troca de ${permitida.nome}: opção inválida.`)
    const motivo = motivoDeBloqueio(opcao, req.novoNivel, novasEscolhas, magiasDaFicha)
    if (motivo) throw new Error(`Troca de ${permitida.nome}: ${opcao.nome}. ${motivo}`)
    const repetida = Object.entries(novasEscolhas).some(([k, v]) => k !== sai && k.replace(/\d+$/, '') === prefixo && v === entra)
    if (repetida) throw new Error(`Troca de ${permitida.nome}: essa opção já foi escolhida.`)
    novasEscolhas[sai] = entra
  }

  const antes = calcularFicha(p).pvMaximo
  const incrementos: Incremento[] = req.incremento
    ? [
        ...p.incrementos,
        escolhas.talento
          ? { nivel: req.novoNivel, aumentos: {}, talento: { id: escolhas.talento.id, escolhas: { ...escolhas.talento.escolhas } } }
          : { nivel: req.novoNivel, aumentos: escolhas.incremento! },
      ]
    : p.incrementos
  const novo: Personagem = {
    ...p,
    nivel: req.novoNivel,
    subclasseId: req.escolherSubclasse ? escolhas.subclasseId! : p.subclasseId,
    incrementos,
    especializacoes: [...p.especializacoes, ...(escolhas.especializacoes ?? [])],
    escolhasDeClasse: novasEscolhas,
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

/**
 * Escolhas de classe que já deviam ter sido feitas e estão vazias
 * (ex.: fichas criadas antes de uma escolha existir no Tomo).
 */
export function escolhasPendentes(p: Personagem): EscolhaDeClasse[] {
  return regrasAtivas(p)
    .flatMap((r) => r.escolhas ?? [])
    .filter((e) => e.nivel <= p.nivel && !p.escolhasDeClasse?.[e.id])
}

/* ---------- Talentos (regra opcional, LdJ p. 167) ---------- */

/** Por que o personagem não pode pegar o talento agora (ou null se pode). Não olha as escolhas do talento. */
export function requisitoDoTalento(p: Personagem, t: Talento): string | null {
  const jaTem = talentosDe(p).filter((x) => x.talento.id === t.id)
  if (jaTem.length > 0 && !t.repetivel) return 'Você já tem este talento.'
  const r = t.requisito
  if (!r) return null
  if (r.atributos && r.minimo) {
    const at = calcularAtributos(p)
    if (!r.atributos.some((a) => at[a].valor >= r.minimo!)) return `Requer ${r.texto}.`
  }
  if (r.conjurador && !calcularFicha(p).conjuracao) return `Requer ${r.texto.toLowerCase()}.`
  if (r.armadura && !calcularFicha(p).proficiencias.armaduras.includes(NOME_CATEGORIA_ARMADURA[r.armadura])) {
    return `Requer ${r.texto.toLowerCase()}.`
  }
  return null
}

/** O que falta ou está errado nas escolhas do talento (ou null se está completo). */
export function problemaNasEscolhasDoTalento(te: TalentoEscolhido, p?: Personagem): string | null {
  const t = TALENTO_POR_ID[te.id]
  if (!t) return 'Escolha um talento.'
  for (const e of t.escolhas ?? []) {
    const valor = te.escolhas?.[e.id]
    if (!valor || !e.opcoes(te.escolhas).some((o) => o.id === valor)) return `${t.nome}: escolha ${e.rotulo.toLowerCase()}.`
    const prefixo = e.id.replace(/\d+$/, '')
    const repetido = Object.entries(te.escolhas).some(([k, v]) => k !== e.id && k.replace(/\d+$/, '') === prefixo && v === valor)
    if (repetido) return `${t.nome}: ${e.rotulo.toLowerCase()} repetida.`
  }
  // Adepto Elemental pode repetir, mas com outro tipo de dano.
  if (t.repetivel && p) {
    const iguais = talentosDe(p).some((x) => x.talento.id === t.id && JSON.stringify(x.escolhas) === JSON.stringify(te.escolhas))
    if (iguais) return `${t.nome}: escolha uma opção diferente da que você já tem.`
  }
  return null
}

export function problemaNoTalento(p: Personagem, te: TalentoEscolhido): string | null {
  const t = TALENTO_POR_ID[te.id]
  if (!t) return 'Escolha um talento.'
  return requisitoDoTalento(p, t) ?? problemaNasEscolhasDoTalento(te, p)
}
