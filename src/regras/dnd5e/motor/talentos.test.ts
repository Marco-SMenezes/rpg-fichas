import { describe, expect, it } from 'vitest'
import { TALENTOS } from '../dados/talentos'
import { criarPersonagem, type EscolhasDeCriacao } from './criacao'
import { calcularFicha } from './ficha'
import { criarEmNivel, problemaNoTalento, requisitosDoNivel, subirDeNivel, type EscolhasDeNivel } from './progressao'

const guerreiro = (extra: Partial<EscolhasDeCriacao> = {}): EscolhasDeCriacao => ({
  nome: 'T', conceito: '', jogador: '', racaId: 'humano', subracaId: null, classeId: 'guerreiro', antecedenteId: 'soldado',
  metodoAtributos: 'manual', atributosBase: { for: 15, des: 13, con: 14, int: 10, sab: 12, car: 8 },
  periciasEscolhidas: ['atletismo', 'percepcao'], especializacoes: [], ferramentasEscolhidas: [], idiomasEscolhidos: [], equipamento: {},
  escolhasDeClasse: { estiloDeLuta: 'defesa' },
  ...extra,
})

/** Sobe até o 3º e troca o incremento do 4º pelo talento. */
function comTalentoNo4(id: string, escolhas: Record<string, string> = {}, extra: Partial<EscolhasDeCriacao> = {}) {
  const niveis: EscolhasDeNivel[] = [2, 3].map((n) => ({ pv: 6, subclasseId: requisitosDoNivel('guerreiro', n).escolherSubclasse ? 'campeao' : undefined }))
  const p3 = criarEmNivel(guerreiro(extra), niveis)
  return subirDeNivel(p3, { pv: 6, talento: { id, escolhas } })
}

describe('talentos (LdJ p. 167–172)', () => {
  it('os 42 do livro, com página e resumo', () => {
    expect(TALENTOS).toHaveLength(42)
    for (const t of TALENTOS) {
      expect(t.pagina).toBeGreaterThanOrEqual(167)
      expect(t.pagina).toBeLessThanOrEqual(172)
      expect(t.resumo.length, t.nome).toBeGreaterThan(20)
    }
  })

  it('Alerta, Robusto e Mobilidade mudam iniciativa, PV e deslocamento', () => {
    const base = calcularFicha(comTalentoNo4('resiliente', { atributo: 'sab' }))
    expect(calcularFicha(comTalentoNo4('alerta')).iniciativa).toBe(base.iniciativa + 5)
    expect(calcularFicha(comTalentoNo4('robusto')).pvMaximo).toBe(base.pvMaximo + 8)
    expect(calcularFicha(comTalentoNo4('mobilidade')).deslocamento).toBe(base.deslocamento + 3)
  })

  it('Resiliente: +1 no atributo e proficiência na resistência', () => {
    const f = calcularFicha(comTalentoNo4('resiliente', { atributo: 'sab' }))
    expect(f.atributos.sab.valor).toBe(12 + 1 + 1)
    expect(f.resistencias.sab.proficiente).toBe(true)
  })

  it('Observador soma +5 na Percepção passiva; Perito dá perícias; Poliglota, idiomas e +1 Int', () => {
    const base = calcularFicha(comTalentoNo4('alerta'))
    const obs = calcularFicha(comTalentoNo4('observador', { atributo: 'int' }))
    expect(obs.percepcaoPassiva).toBe(base.percepcaoPassiva + 5)
    const perito = calcularFicha(comTalentoNo4('perito', { pericia1: 'arcanismo', pericia2: 'historia', pericia3: 'medicina' }))
    expect(perito.pericias.find((x) => x.id === 'medicina')?.grau).toBe(1)
    const pol = calcularFicha(comTalentoNo4('poliglota', { idioma1: 'Élfico', idioma2: 'Dracônico', idioma3: 'Orc' }))
    expect(pol.proficiencias.idiomas).toEqual(expect.arrayContaining(['Élfico', 'Dracônico', 'Orc']))
    expect(pol.atributos.int.valor).toBe(base.atributos.int.valor + 1)
  })

  it('Sortudo vira recurso de 3 por descanso longo', () => {
    expect(calcularFicha(comTalentoNo4('sortudo')).recursos.find((r) => r.id === 'talento-sorte')?.maximo).toBe(3)
  })

  it('pré-requisitos: atributo, conjuração e proficiência em armadura', () => {
    expect(() => comTalentoNo4('duelista-defensivo')).not.toThrow()
    expect(() => comTalentoNo4('lider-inspirador')).toThrow(/Carisma 13/)
    expect(() => comTalentoNo4('conjurador-de-guerra')).toThrow(/conjurar/)
    expect(() => comTalentoNo4('maestria-armadura-pesada')).not.toThrow()
  })

  it('não pega o mesmo talento duas vezes; escolhas incompletas são recusadas', () => {
    const p = comTalentoNo4('alerta')
    expect(problemaNoTalento(p, { id: 'alerta', escolhas: {} })).toMatch(/já tem/)
    expect(() => comTalentoNo4('atleta')).toThrow(/atributo/)
    expect(() => comTalentoNo4('perito', { pericia1: 'arcanismo', pericia2: 'arcanismo', pericia3: 'medicina' })).toThrow(/repetida/)
  })
})

describe('humano variante (LdJ p. 31)', () => {
  const variante = (talento: { id: string; escolhas: Record<string, string> }) =>
    criarPersonagem(
      guerreiro({
        racaId: 'humano-variante',
        escolhasRaciais: { aumentos: ['for', 'con'], pericias: ['intimidacao'], ferramenta: '', ancestral: '', talento },
      }),
    )

  it('+1 em dois atributos, uma perícia e o talento já no 1º nível', () => {
    const f = calcularFicha(variante({ id: 'atleta', escolhas: { atributo: 'for' } }))
    expect(f.atributos.for.valor).toBe(15 + 1 + 1)
    expect(f.atributos.con.valor).toBe(14 + 1)
    expect(f.atributos.des.valor).toBe(13)
    expect(f.pericias.find((x) => x.id === 'intimidacao')?.grau).toBe(1)
    expect(f.habilidades.some((h) => h.nome === 'Atleta')).toBe(true)
  })

  it('o humano comum não ganha talento mesmo que o dado exista', () => {
    const p = criarPersonagem(guerreiro({ escolhasRaciais: { aumentos: [], pericias: [], ferramenta: '', ancestral: '', talento: { id: 'alerta', escolhas: {} } } }))
    // Des 13 + 1 do humano = 14 (+2), sem o +5 do Alerta.
    expect(calcularFicha(p).iniciativa).toBe(2)
  })
})
