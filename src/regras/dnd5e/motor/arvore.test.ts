import { describe, expect, it } from 'vitest'
import type { EscolhaDeClasse } from '../tipos'
import { linhasDaArvore, montarArvore, type ArvoreDeEvolucao, type NoDaArvore } from './arvore'
import type { EscolhasDeCriacao } from './criacao'
import { criarEmNivel, primeiraOpcaoLivre, requisitosDoNivel, type EscolhasDeNivel } from './progressao'

const base = (classeId: string, escolhasDeClasse: Record<string, string> = {}): EscolhasDeCriacao => ({
  escolhasDeClasse,
  nome: 'Teste',
  conceito: '',
  jogador: '',
  racaId: 'humano',
  subracaId: null,
  classeId,
  antecedenteId: 'soldado',
  metodoAtributos: 'manual',
  atributosBase: { for: 15, des: 13, con: 13, int: 9, sab: 11, car: 13 },
  periciasEscolhidas: [],
  especializacoes: [],
  ferramentasEscolhidas: ['Conjunto de dados'],
  idiomasEscolhidos: ['Anão'],
  equipamento: {},
})

function escolherLivres(lista: EscolhaDeClasse[], anteriores: EscolhasDeNivel[]) {
  const ate: Record<string, string> = Object.assign({}, ...anteriores.map((n) => n.escolhas ?? {}))
  for (const e of lista) ate[e.id] = primeiraOpcaoLivre(e, ate)!
  return Object.fromEntries(lista.map((e) => [e.id, ate[e.id]!]))
}

function ate(classeId: string, nivel: number, subclasseId: string, nivel1: Record<string, string> = {}) {
  const niveis: EscolhasDeNivel[] = []
  for (let n = 2; n <= nivel; n++) {
    const req = requisitosDoNivel(classeId, n, n >= 3 ? subclasseId : null)
    niveis.push({
      pv: req.pvMedio,
      subclasseId: req.escolherSubclasse ? subclasseId : undefined,
      incremento: req.incremento ? { for: 1, con: 1 } : undefined,
      escolhas: escolherLivres(req.escolhas, niveis),
    })
  }
  return criarEmNivel(base(classeId, nivel1), niveis)
}

describe('árvore de evolução', () => {
  it('guerreiro Campeão nível 5: tronco liberado até o 4, atual no 5, próximo no 6', () => {
    const a = montarArvore(ate('guerreiro', 5, 'campeao'))
    expect(a.tronco).toHaveLength(20)
    expect(a.tronco.slice(0, 4).every((n) => n.estado === 'liberado')).toBe(true)
    expect(a.tronco[4]!).toMatchObject({ nivel: 5, estado: 'atual' })
    expect(a.tronco[5]!).toMatchObject({ nivel: 6, estado: 'proximo' })
    expect(a.tronco[6]!.estado).toBe('futuro')
    expect(a.tronco[4]!.caracteristicas.map((h) => h.nome)).toContain('Ataque Extra')
  })

  it('mostra só o ramo da subclasse escolhida e conta as outras', () => {
    const a = montarArvore(ate('guerreiro', 5, 'campeao'))
    expect(a.ramos).toHaveLength(1)
    expect(a.ramos[0]!).toMatchObject({ id: 'campeao', ativo: true })
    expect(a.ramos[0]!.nos[0]!.caracteristicas.map((h) => h.nome)).toContain('Crítico Aprimorado')
    expect(a.outrasSubclasses).toBe(2)
  })

  it('marca a subclasse e os aumentos de atributo já feitos', () => {
    const a = montarArvore(ate('guerreiro', 5, 'campeao'))
    expect(a.tronco[2]!.escolhas.find((e) => e.tipo === 'subclasse')).toMatchObject({ valor: 'Campeão', pendente: false })
    expect(a.tronco[3]!.escolhas.find((e) => e.tipo === 'atributo')).toMatchObject({ valor: '+1 FOR +1 CON', pendente: false })
  })

  it('nível 1 de um mago: todos os ramos aparecem e nada está pendente', () => {
    const p = ate('mago', 1, 'abjuracao')
    const a = montarArvore({ ...p, subclasseId: null })
    expect(a.ramos.length).toBeGreaterThan(1)
    expect(a.ramos.every((r) => !r.ativo)).toBe(true)
    expect(a.outrasSubclasses).toBe(0)
    expect(a.tronco.flatMap((n) => n.escolhas).some((e) => e.pendente)).toBe(false)
  })

  it('subclasse não escolhida depois do nível dela fica pendente', () => {
    const p = ate('guerreiro', 3, 'campeao')
    const a = montarArvore({ ...p, subclasseId: null })
    expect(a.tronco[2]!.escolhas.find((e) => e.tipo === 'subclasse')).toMatchObject({ valor: null, pendente: true })
  })

  it('nível 20: sem nó próximo e todos os aumentos preenchidos', () => {
    const a = montarArvore(ate('guerreiro', 20, 'campeao', { estiloDeLuta: 'duelismo' }))
    expect(a.tronco[19]!.estado).toBe('atual')
    expect(a.tronco.some((n) => n.estado === 'proximo')).toBe(false)
    expect(a.tronco.flatMap((n) => n.escolhas).some((e) => e.pendente)).toBe(false)
  })
})

describe('linhasDaArvore', () => {
  const no = (nivel: number, conteudo: boolean, atual = 5): NoDaArvore => ({
    nivel,
    estado: nivel < atual ? 'liberado' : nivel === atual ? 'atual' : nivel === atual + 1 ? 'proximo' : 'futuro',
    caracteristicas: conteudo ? [{ id: `h${nivel}`, nivel, nome: `H${nivel}`, pagina: 1, resumo: '' }] : [],
    escolhas: [],
  })
  const arvore = (comNovidade: number[], ramo: number[] | null): ArvoreDeEvolucao => ({
    classe: 'X',
    nivel: 5,
    tronco: Array.from({ length: 20 }, (_, i) => no(i + 1, comNovidade.includes(i + 1))),
    ramos: ramo ? [{ id: 'r', nome: 'R', ativo: true, nos: ramo.map((n) => no(n, true)) }] : [],
    outrasSubclasses: 0,
  })

  it('só os níveis com novidade viram marco; os vazios seguidos viram um intervalo', () => {
    const l = linhasDaArvore(arvore([1, 2, 5, 9], null))
    expect(l.map((x) => (x.tipo === 'marco' ? x.nivel : `${x.de}-${x.ate}`))).toEqual([1, 2, '3-4', 5, '6-8', 9, '10-20'])
  })

  it('um nível vazio sozinho vira intervalo de um nível só', () => {
    const l = linhasDaArvore(arvore([1, 3], null))
    expect(l[1]).toEqual({ tipo: 'vazio', de: 2, ate: 2, ramo: false })
  })

  it('o ramo da subclasse traz marcos em níveis onde o tronco está vazio', () => {
    const l = linhasDaArvore(arvore([1, 3, 10], [3, 7, 10]))
    const marcos = l.filter((x) => x.tipo === 'marco')
    expect(marcos.map((m) => m.nivel)).toEqual([1, 3, 7, 10])
    const sete = marcos.find((m) => m.nivel === 7)!
    expect(sete.tronco).toBeNull()
    expect(sete.ramo?.nivel).toBe(7)
  })

  it('marca onde o ramo nasce, onde passa e onde acaba', () => {
    const l = linhasDaArvore(arvore([1, 3, 10], [3, 7]))
    const porNivel = (n: number) => l.find((x) => (x.tipo === 'marco' ? x.nivel === n : n >= x.de && n <= x.ate))!
    expect(porNivel(1)).toMatchObject({ ramoPassa: false })
    expect(porNivel(3)).toMatchObject({ tipo: 'marco', forquilha: true, ramoPassa: true, ramoFim: false })
    expect(porNivel(5)).toMatchObject({ tipo: 'vazio', ramo: true })
    expect(porNivel(7)).toMatchObject({ tipo: 'marco', forquilha: false, ramoPassa: true, ramoFim: true })
    expect(porNivel(10)).toMatchObject({ tipo: 'marco', ramo: null, ramoPassa: false })
  })
})
