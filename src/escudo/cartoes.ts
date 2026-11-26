/**
 * Cartões de consulta do escudo do mestre. Os padrões saem dos dados do Tomo (armas,
 * armaduras, condições, perícias) e o mestre edita, oculta, reordena e cria os seus.
 * No texto, linhas com " | " viram tabela (a primeira é o cabeçalho).
 */
import type { SistemaDaCampanha } from '../nuvem/mesa'
import { ATRIBUTOS, PERICIAS } from '../regras/dnd5e/dados/atributos'
import { CONDICOES, EXAUSTAO } from '../regras/dnd5e/dados/condicoes'
import { ARMADURAS, ARMAS } from '../regras/dnd5e/dados/equipamento'
import { NOME_PROPRIEDADE } from '../regras/dnd5e/motor/ficha'
import type { PericiaId } from '../regras/dnd5e/tipos'
import { novoId } from '../universal/modelo'

export interface Cartao {
  id: string
  titulo: string
  texto: string
  oculto: boolean
}

/** Para que serve cada perícia (palavras do Tomo). */
const USO_DA_PERICIA: Record<PericiaId, string> = {
  acrobacia: 'equilíbrio, piruetas, cair sem se machucar',
  adestrarAnimais: 'acalmar ou conduzir animais e montarias',
  arcanismo: 'magias, itens mágicos, planos e símbolos arcanos',
  atletismo: 'escalar, saltar, nadar, agarrar e empurrar',
  atuacao: 'entreter com música, dança ou teatro',
  enganacao: 'mentir, blefar, disfarçar intenções',
  furtividade: 'esconder-se e se mover sem ser notado',
  historia: 'reinos, guerras, lendas e figuras do passado',
  intimidacao: 'ameaçar e pressionar com força ou presença',
  intuicao: 'perceber mentiras, intenções e o humor de alguém',
  investigacao: 'procurar pistas, deduzir, achar mecanismos',
  medicina: 'estabilizar quem está morrendo, diagnosticar',
  natureza: 'terreno, plantas, animais e clima',
  percepcao: 'notar algo com os sentidos: ver, ouvir, farejar',
  persuasao: 'convencer com tato e boa-fé, negociar',
  prestidigitacao: 'truques de mão, punga, plantar objetos',
  religiao: 'deuses, ritos, símbolos sagrados e mortos-vivos',
  sobrevivencia: 'rastrear, caçar, orientar-se, prever o tempo',
}

const DANO = { perfurante: 'perfurante', cortante: 'cortante', concussao: 'concussão' } as const
const metros = (m: number) => String(m).replace('.', ',')
const abrev = (id: string) => {
  const a = ATRIBUTOS.find((x) => x.id === id)!.abrev
  return a[0] + a.slice(1).toLowerCase()
}

export function cartoesPadrao(sistema: SistemaDaCampanha): Cartao[] {
  if (sistema !== 'dnd5e') return []
  const c = (id: string, titulo: string, texto: string): Cartao => ({ id: `padrao-${id}`, titulo, texto, oculto: false })
  return [
    c(
      'cds',
      'CDs típicas',
      ['Dificuldade | CD', 'Muito fácil | 5', 'Fácil | 10', 'Média | 15', 'Difícil | 20', 'Muito difícil | 25', 'Quase impossível | 30'].join('\n'),
    ),
    c(
      'pericias',
      'Perícias',
      ['Perícia | Atrib. | Serve para', ...PERICIAS.map((p) => `${p.nome} | ${abrev(p.atributo)} | ${USO_DA_PERICIA[p.id]}`)].join('\n'),
    ),
    c(
      'armas',
      'Armas',
      [
        'Arma | Dano | Propriedades',
        ...ARMAS.map((a) => {
          const props = a.propriedades.map((x) => NOME_PROPRIEDADE[x] ?? x)
          if (a.versatil) props.push(`versátil ${a.versatil}`)
          if (a.distancia) props.push(`${metros(a.distancia[0])}/${metros(a.distancia[1])} m`)
          return `${a.nome} | ${a.dano} ${DANO[a.tipoDano]} | ${props.join(', ') || '—'}`
        }),
      ].join('\n'),
    ),
    c(
      'armaduras',
      'Armaduras',
      [
        'Armadura | CA | Força | Furtividade',
        ...ARMADURAS.map(
          (a) =>
            `${a.nome} | ${a.caBase}${a.limiteDes === null ? ' + Des' : a.limiteDes > 0 ? ` + Des (máx. ${a.limiteDes})` : ''} | ${a.forcaMinima ?? '—'} | ${a.desvantagemFurtividade ? 'desvantagem' : '—'}`,
        ),
        'Escudo | +2 | — | —',
      ].join('\n'),
    ),
    c('condicoes', 'Condições', ['Condição | Efeito', ...CONDICOES.map((x) => `${x.nome} | ${x.resumo}`)].join('\n')),
    c(
      'cobertura',
      'Cobertura e visibilidade',
      [
        'Situação | Efeito',
        'Meia cobertura | +2 na CA e em testes de resistência de Destreza',
        'Três quartos de cobertura | +5 na CA e em testes de resistência de Destreza',
        'Cobertura total | não pode ser alvo direto',
        'Área levemente obscurecida | desvantagem em Sabedoria (Percepção) que dependa da visão',
        'Área densamente obscurecida | quem tenta ver ali fica, na prática, cego',
        'Atacante não visto | vantagem no ataque',
        'Alvo não visto | desvantagem no ataque',
      ].join('\n'),
    ),
    c(
      'descanso',
      'Descanso e exaustão',
      [
        'Descanso curto: 1 hora. Gasta Dados de Vida para recuperar PV.',
        'Descanso longo: 8 horas. Recupera todos os PV e metade dos Dados de Vida; tira 1 nível de exaustão.',
        '',
        'Exaustão | Efeito (cumulativo)',
        ...EXAUSTAO.slice(1).map((e, i) => `${i + 1} | ${e}`),
      ].join('\n'),
    ),
  ]
}

export function novoCartao(): Cartao {
  return { id: novoId('cartao'), titulo: 'Novo cartão', texto: '', oculto: false }
}

/** Sem nada salvo (null) ou com lixo → padrões. Lista salva (mesmo vazia) é respeitada. */
export function normalizarCartoes(x: unknown, sistema: SistemaDaCampanha): Cartao[] {
  if (!Array.isArray(x)) return cartoesPadrao(sistema)
  return x
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object' && typeof (c as { id?: unknown }).id === 'string')
    .map((c) => ({
      id: c.id as string,
      titulo: typeof c.titulo === 'string' ? c.titulo : '',
      texto: typeof c.texto === 'string' ? c.texto : '',
      oculto: c.oculto === true,
    }))
}

export type Bloco = { tipo: 'tabela'; cabecalho: string[]; linhas: string[][] } | { tipo: 'paragrafo'; texto: string }

export function blocosDoCartao(texto: string): Bloco[] {
  const blocos: Bloco[] = []
  let tabela: string[][] | null = null
  const fecharTabela = () => {
    if (!tabela) return
    const largura = Math.max(...tabela.map((l) => l.length))
    const cheia = tabela.map((l) => [...l, ...Array(largura - l.length).fill('')])
    blocos.push({ tipo: 'tabela', cabecalho: cheia[0]!, linhas: cheia.slice(1) })
    tabela = null
  }
  for (const linha of texto.split('\n')) {
    if (linha.includes(' | ') || linha.trim() === '|') {
      ;(tabela ??= []).push(linha.split('|').map((c) => c.trim()))
      continue
    }
    fecharTabela()
    if (linha.trim()) blocos.push({ tipo: 'paragrafo', texto: linha.trim() })
  }
  fecharTabela()
  return blocos
}

export function moverCartao(l: Cartao[], id: string, direcao: -1 | 1): Cartao[] {
  const i = l.findIndex((c) => c.id === id)
  const j = i + direcao
  if (i < 0 || j < 0 || j >= l.length) return l
  const nova = [...l]
  ;[nova[i], nova[j]] = [nova[j]!, nova[i]!]
  return nova
}
