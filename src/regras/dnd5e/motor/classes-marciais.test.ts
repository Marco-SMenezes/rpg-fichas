import { describe, expect, it } from 'vitest'
import type { EscolhasDeCriacao } from './criacao'
import { calcularFicha } from './ficha'
import { criarEmNivel, descansoCurto, descansoLongo, requisitosDoNivel, usarRecurso, type EscolhasDeNivel } from './progressao'

/** Humano com For 16, Des 14, Con 14, Int 10, Sab 12, Car 14 (já com +1 racial). */
const base = (classeId: string, extra: Partial<EscolhasDeCriacao> = {}): EscolhasDeCriacao => ({
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
  ...extra,
})

/** Sobe até `nivel` com PV fixo, preenchendo subclasse, incrementos (+2 For) e escolhas pela primeira opção. */
function ate(classeId: string, nivel: number, subclasseId: string, escolhasFixas: Record<string, string> = {}, extra: Partial<EscolhasDeCriacao> = {}) {
  const niveis: EscolhasDeNivel[] = []
  for (let n = 2; n <= nivel; n++) {
    const req = requisitosDoNivel(classeId, n, n > 3 || n === 3 ? subclasseId : null)
    niveis.push({
      pv: req.pvMedio,
      subclasseId: req.escolherSubclasse ? subclasseId : undefined,
      incremento: req.incremento ? { for: 1, con: 1 } : undefined,
      especializacoes: undefined,
      escolhas: Object.fromEntries(req.escolhas.map((e) => [e.id, escolhasFixas[e.id] ?? e.opcoes[0]!.id])),
    })
  }
  return criarEmNivel(base(classeId, extra), niveis)
}

describe('bárbaro (LdJ p. 46)', () => {
  it('1º nível: d12, defesa sem armadura com Con, 2 fúrias de +2', () => {
    const f = calcularFicha(ate('barbaro', 1, 'furioso'))
    expect(f.pvMaximo).toBe(12 + 2)
    expect(f.ca.valor).toBe(10 + 2 + 2)
    expect(f.recursos.find((r) => r.id === 'furia')).toMatchObject({ maximo: 2, recarga: 'longo' })
    expect(f.extras).toContainEqual({ nome: 'Dano de fúria', valor: '+2' })
  })
  it('5º: dois ataques e +3 m sem armadura pesada; 9º: fúria +3 e crítico brutal', () => {
    expect(calcularFicha(ate('barbaro', 5, 'furioso'))).toMatchObject({ ataquesPorAcao: 2, deslocamento: 12 })
    const f9 = calcularFicha(ate('barbaro', 9, 'furioso'))
    expect(f9.extras).toEqual(expect.arrayContaining([{ nome: 'Dano de fúria', valor: '+3' }, { nome: 'Crítico brutal', valor: '+1 dado' }]))
  })
  it('20º: fúria ilimitada e Campeão Primitivo (+4 For e Con, máximo 24)', () => {
    const f = calcularFicha(ate('barbaro', 20, 'furioso'))
    expect(f.recursos.find((r) => r.id === 'furia')!.maximo).toBeNull()
    expect(f.atributos.for.valor).toBe(24)
  })
  it('totem escolhido no 3º nível fica guardado', () => {
    const p = ate('barbaro', 3, 'totemico', { totem: 'lobo' })
    expect(p.escolhasDeClasse.totem).toBe('lobo')
  })
})

describe('guerreiro (LdJ p. 83)', () => {
  it('estilo Defesa soma +1 na CA com armadura; Arquearia +2 no ataque à distância', () => {
    const def = calcularFicha(ate('guerreiro', 1, 'campeao', {}, { escolhasDeClasse: { estiloDeLuta: 'defesa' } }))
    // cota de malha 16 + escudo (vem equipado) 2 + Defesa 1
    expect(def.ca.valor).toBe(16 + 2 + 1)
    const arq = calcularFicha(ate('guerreiro', 1, 'campeao', {}, { escolhasDeClasse: { estiloDeLuta: 'arquearia' }, equipamento: { armadura: 1 } }))
    expect(arq.ataques.find((a) => a.nome === 'Arco longo')!.bonusAtaque).toBe(2 + 2 + 2)
  })
  it('recursos: retomar o fôlego, surto de ação (2 no 17º) e indomável (3 no 17º)', () => {
    const f = calcularFicha(ate('guerreiro', 17, 'campeao'))
    expect(f.recursos.map((r) => [r.id, r.maximo])).toEqual([['folego', 1], ['surto', 2], ['indomavel', 3]])
    expect(f.ataquesPorAcao).toBe(3)
  })
  it('Campeão: crítico com 19 no 3º e 18 no 15º', () => {
    expect(calcularFicha(ate('guerreiro', 3, 'campeao')).margemCritico).toBe(19)
    expect(calcularFicha(ate('guerreiro', 15, 'campeao')).margemCritico).toBe(18)
  })
  it('Mestre de Batalha: dados de superioridade e CD das manobras', () => {
    const f = calcularFicha(ate('guerreiro', 10, 'mestre-de-batalha'))
    expect(f.recursos.find((r) => r.id === 'superioridade')).toMatchObject({ maximo: 5, detalhe: 'd10', recarga: 'curto' })
    // For 18 no 10º (16 + 3 incrementos de +1), prof +4
    expect(f.extras.find((e) => e.nome === 'CD das manobras')!.valor).toBe(String(8 + 4 + 4))
  })
  it('descanso curto devolve recursos de descanso curto; o longo devolve todos', () => {
    let p = ate('guerreiro', 9, 'campeao')
    p = usarRecurso(usarRecurso(usarRecurso(p, 'folego', 1), 'surto', 1), 'indomavel', 1)
    p = descansoCurto(p, [])
    expect(p.estado.recursosGastos).toEqual({ indomavel: 1 })
    expect(descansoLongo(p).estado.recursosGastos).toEqual({})
  })
})

describe('monge (LdJ p. 102)', () => {
  it('defesa sem armadura com Sab, ataque desarmado com artes marciais e movimento', () => {
    const p = ate('monge', 6, 'mao-aberta')
    // Sem a armadura: monge não começa com armadura
    const f = calcularFicha(p)
    expect(f.ca.valor).toBe(10 + 2 + 1)
    // For 17 (+3) é melhor que Des 14 (+2)
    expect(f.ataques[0]).toMatchObject({ nome: 'Ataque desarmado', dano: '1d6+3' })
    expect(f.deslocamento).toBe(9 + 4.5)
    expect(f.recursos.find((r) => r.id === 'chi')!.maximo).toBe(6)
    expect(f.extras).toContainEqual({ nome: 'CD do chi', valor: String(8 + 3 + 1) })
  })
  it('espada curta usa o melhor entre For e Des e o dado de artes marciais se for maior', () => {
    const f = calcularFicha(ate('monge', 11, 'sombra'))
    expect(f.ataques.find((a) => a.nome === 'Espada curta')!.dano.startsWith('1d8')).toBe(true)
  })
  it('14º: proficiência em todas as resistências', () => {
    const f = calcularFicha(ate('monge', 14, 'sombra'))
    expect(Object.values(f.resistencias).every((r) => r.proficiente)).toBe(true)
  })
  it('ferramenta escolhida entra nas proficiências', () => {
    const f = calcularFicha(ate('monge', 1, 'sombra', {}, { escolhasDeClasse: { ferramenta: 'Flauta' } }))
    expect(f.proficiencias.ferramentas).toContain('Flauta')
  })
})

describe('paladino (LdJ p. 108)', () => {
  it('1º nível: cura pelas mãos 5 × nível e sentido divino 1 + Car', () => {
    const f = calcularFicha(ate('paladino', 1, 'devocao'))
    expect(f.recursos.find((r) => r.id === 'cura-pelas-maos')!.maximo).toBe(5)
    expect(f.recursos.find((r) => r.id === 'sentido-divino')!.maximo).toBe(3)
  })
  it('meio conjurador com Carisma: sem espaços no 1º, 2 no 2º; prepara Car + metade do nível', () => {
    expect(calcularFicha(ate('paladino', 1, 'devocao')).conjuracao!.espacos).toEqual([])
    const f = calcularFicha(ate('paladino', 5, 'devocao'))
    expect(f.conjuracao).toMatchObject({ espacos: [4, 2], preparadas: 2 + 2, cd: 8 + 3 + 2 })
  })
  it('6º: Aura de Proteção soma Carisma em todas as resistências', () => {
    const f5 = calcularFicha(ate('paladino', 5, 'vinganca'))
    const f6 = calcularFicha(ate('paladino', 6, 'vinganca'))
    expect(f6.resistencias.for.bonus - f5.resistencias.for.bonus).toBe(2)
  })
  it('magias de juramento aparecem conforme o nível', () => {
    const f = calcularFicha(ate('paladino', 5, 'vinganca'))
    expect(f.extras.find((e) => e.nome === 'Magias de juramento')!.valor).toBe('perdição, marca do caçador, imobilizar pessoa, passo nebuloso')
  })
  it('estilo de luta é pedido no 2º nível', () => {
    expect(requisitosDoNivel('paladino', 2).escolhas.map((e) => e.id)).toEqual(['estiloDeLuta'])
  })
})
