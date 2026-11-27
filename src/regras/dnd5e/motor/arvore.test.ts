import { describe, expect, it } from 'vitest'
import type { EscolhaDeClasse } from '../tipos'
import { montarArvore } from './arvore'
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
