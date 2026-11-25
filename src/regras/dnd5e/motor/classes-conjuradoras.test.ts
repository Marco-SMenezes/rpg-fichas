import type { EscolhaDeClasse } from '../tipos'
import { describe, expect, it } from 'vitest'
import { espacosDePacto } from '../dados/magia'
import type { EscolhasDeCriacao } from './criacao'
import { calcularFicha } from './ficha'
import { magiasDisponiveis, magiasSempre } from './magias'
import { criarEmNivel, primeiraOpcaoLivre, descansoCurto, gastarEspaco, requisitosDoNivel, type EscolhasDeNivel } from './progressao'

/** Humano com Int, Sab e Car 16 (já com +1 racial) e Des 14, Con 14. */
const base = (classeId: string, extra: Partial<EscolhasDeCriacao> = {}): EscolhasDeCriacao => ({
  nome: 'Teste', conceito: '', jogador: '', racaId: 'humano', subracaId: null, classeId, antecedenteId: 'sabio',
  metodoAtributos: 'manual', atributosBase: { for: 9, des: 13, con: 13, int: 15, sab: 15, car: 15 },
  periciasEscolhidas: [], especializacoes: [], ferramentasEscolhidas: [], idiomasEscolhidos: ['Anão', 'Élfico'], equipamento: {},
  ...extra,
})

function ate(classeId: string, nivel: number, subclasseId: string, escolhasFixas: Record<string, string> = {}, extra: Partial<EscolhasDeCriacao> = {}) {
  const niveis: EscolhasDeNivel[] = []
  for (let n = 2; n <= nivel; n++) {
    const req = requisitosDoNivel(classeId, n, subclasseId)
    niveis.push({
      pv: req.pvMedio,
      subclasseId: req.escolherSubclasse ? subclasseId : undefined,
      incremento: req.incremento ? { des: 1, con: 1 } : undefined,
      especializacoes: req.especializacoes ? (['historia', 'arcanismo'] as const).slice(0, req.especializacoes) as never : undefined,
      escolhas: escolherLivres(req.escolhas, escolhasFixas, niveis),
    })
  }
  return criarEmNivel(base(classeId, { subclasseId, ...extra }), niveis)
}

/** Preenche cada escolha com a primeira opção que ainda não foi usada. */
function escolherLivres(lista: EscolhaDeClasse[], fixas: Record<string, string>, anteriores: EscolhasDeNivel[]) {
  const ate: Record<string, string> = Object.assign({}, ...anteriores.map((n) => n.escolhas ?? {}))
  for (const e of lista) ate[e.id] = fixas[e.id] ?? primeiraOpcaoLivre(e, ate)!
  return Object.fromEntries(lista.map((e) => [e.id, ate[e.id]!]))
}

describe('magia de pacto do bruxo (LdJ p. 57)', () => {
  it('espaços por nível: um no 1º, dois do 2º ao 10º, três no 11º, quatro no 17º; nível do espaço até o 5º', () => {
    expect(espacosDePacto(1)).toEqual([1])
    expect(espacosDePacto(3)).toEqual([0, 2])
    expect(espacosDePacto(9)).toEqual([0, 0, 0, 0, 2])
    expect(espacosDePacto(11)).toEqual([0, 0, 0, 0, 3])
    expect(espacosDePacto(20)).toEqual([0, 0, 0, 0, 4])
  })
  it('os espaços de pacto voltam no descanso curto', () => {
    let p = ate('bruxo', 3, 'corruptor')
    p = gastarEspaco(p, 2, 1)
    expect(p.estado.espacosGastos).toEqual([0, 1])
    expect(descansoCurto(p, []).estado.espacosGastos).toEqual([])
  })
  it('patrono amplia a lista e Arcana Mística libera magias de 6º nível no 11º', () => {
    const p = ate('bruxo', 1, 'corruptor')
    expect(magiasDisponiveis(p).some((m) => m.id === 'comando')).toBe(true)
    expect(magiasDisponiveis(ate('bruxo', 11, 'corruptor')).some((m) => m.nivel === 6)).toBe(true)
    expect(calcularFicha(ate('bruxo', 11, 'corruptor')).recursos.map((r) => r.id)).toContain('arcana-6')
  })
  it('invocações: duas no 2º, oito no 18º', () => {
    expect(requisitosDoNivel('bruxo', 2).escolhas.filter((e) => e.id.startsWith('invocacao'))).toHaveLength(2)
    expect(calcularFicha(ate('bruxo', 18, 'arquifada')).extras.find((e) => e.nome === 'Invocações conhecidas')!.valor).toBe('8')
  })
})

describe('clérigo (LdJ p. 63)', () => {
  it('domínio no 1º nível: Vida dá armadura pesada e magias sempre preparadas', () => {
    const p = ate('clerigo', 1, 'vida')
    expect(calcularFicha(p).proficiencias.armaduras).toContain('Armaduras pesadas')
    expect(magiasSempre(p).map((m) => m.id)).toEqual(['bencao', 'curar-ferimentos'])
    expect(magiasSempre(ate('clerigo', 5, 'vida')).length).toBe(6)
  })
  it('Guerra dá armas marciais; prepara Sab + nível; 3 truques', () => {
    const f = calcularFicha(ate('clerigo', 1, 'guerra'))
    expect(f.proficiencias.armas).toContain('Armas marciais')
    expect(f.conjuracao).toMatchObject({ preparadas: 3 + 1, truques: 3, cd: 8 + 2 + 3, espacos: [2] })
  })
  it('canalizar divindade: 1 no 2º, 2 no 6º, 3 no 18º', () => {
    expect(calcularFicha(ate('clerigo', 6, 'luz')).recursos.find((r) => r.id === 'canalizar')!.maximo).toBe(2)
    expect(calcularFicha(ate('clerigo', 18, 'luz')).recursos.find((r) => r.id === 'canalizar')!.maximo).toBe(3)
  })
})

describe('mago, druida, feiticeiro e bardo', () => {
  it('mago: 3 truques, prepara Int + nível, grimório mínimo de 6 + 2 por nível', () => {
    const f = calcularFicha(ate('mago', 3, 'evocacao'))
    expect(f.conjuracao).toMatchObject({ truques: 3, preparadas: 3 + 3, espacos: [4, 2] })
    expect(f.extras).toContainEqual({ nome: 'Magias no grimório (mínimo)', valor: '10' })
  })
  it('druida da Terra (floresta): magias de círculo a partir do 3º', () => {
    const p = ate('druida', 3, 'terra', { terreno: 'Floresta' })
    expect(magiasSempre(p).map((m) => m.id)).toEqual(['patas-de-aranha', 'pele-de-arvore'])
    expect(calcularFicha(p).recursos.find((r) => r.id === 'forma-selvagem')!.maximo).toBe(2)
  })
  it('feiticeiro dracônico: CA 13 + Des sem armadura e +1 PV por nível', () => {
    const p = ate('feiticeiro', 2, 'draconica', {}, { equipamento: {} })
    const f = calcularFicha(p)
    expect(f.ca.valor).toBe(13 + 2)
    expect(f.pvMaximo).toBe(6 + 2 + 1 + (4 + 2 + 1))
    expect(f.recursos.find((r) => r.id === 'pontos-feiticaria')!.maximo).toBe(2)
    expect(f.conjuracao).toMatchObject({ truques: 4, conhecidas: 3 })
  })
  it('bardo: Versatilidade soma metade da proficiência em perícias sem proficiência a partir do 2º', () => {
    const atletismo = (n: number) => calcularFicha(ate('bardo', n, 'conhecimento')).pericias.find((x) => x.id === 'atletismo')!.bonus
    // Força 9 + 1 (humano) = 10, modificador 0
    expect(atletismo(1)).toBe(0)
    expect(atletismo(2)).toBe(0 + 1)
    expect(calcularFicha(ate('bardo', 5, 'conhecimento')).recursos[0]).toMatchObject({ id: 'inspiracao-bardo', maximo: 3, recarga: 'curto', detalhe: 'd8' })
  })
  it('bardo escolhe três instrumentos que viram proficiência', () => {
    const p = ate('bardo', 1, 'conhecimento', {}, { escolhasDeClasse: { instrumento1: 'Alaúde', instrumento2: 'Flauta', instrumento3: 'Lira' } })
    expect(calcularFicha(p).proficiencias.ferramentas).toEqual(expect.arrayContaining(['Alaúde', 'Flauta', 'Lira']))
  })
})

describe('subclasses conjuradoras de classes marciais', () => {
  it('Trapaceiro Arcano usa a lista de mago a partir do 3º', () => {
    const p = ate('ladino', 3, 'trapaceiro-arcano')
    const f = calcularFicha(p)
    expect(f.conjuracao).toMatchObject({ atributo: 'int', espacos: [2], truques: 3, conhecidas: 3 })
    expect(magiasDisponiveis(p).every((m) => m.classes.includes('mago') && m.nivel <= 1)).toBe(true)
  })
  it('Cavaleiro Arcano: 2 truques e 3 magias no 3º', () => {
    expect(calcularFicha(ate('guerreiro', 3, 'cavaleiro-arcano')).conjuracao).toMatchObject({ truques: 2, conhecidas: 3 })
  })
})
