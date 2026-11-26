import { describe, expect, it } from 'vitest'
import { criarPersonagem, type EscolhasDeCriacao } from './criacao'
import { calcularFicha } from './ficha'
import {
  alternarCondicao,
  aplicarDano,
  curar,
  definirExaustao,
  descansoLongo,
  encerrarConcentracao,
  iniciarConcentracao,
  marcarMorte,
  salvamentoContraMorte,
  situacaoDaMorte,
} from './progressao'

const escolhas: EscolhasDeCriacao = {
  nome: 'T', conceito: '', jogador: '', racaId: 'humano', subracaId: null, classeId: 'guerreiro', antecedenteId: 'soldado',
  metodoAtributos: 'manual', atributosBase: { for: 15, des: 13, con: 14, int: 10, sab: 12, car: 8 },
  periciasEscolhidas: ['atletismo', 'percepcao'], especializacoes: [], ferramentasEscolhidas: [], idiomasEscolhidos: [], equipamento: {},
  escolhasDeClasse: { estiloDeLuta: 'defesa' },
}
const novo = () => criarPersonagem(escolhas)
const PV = calcularFicha(novo()).pvMaximo
const caido = () => aplicarDano(novo(), PV)

describe('testes contra a morte (LdJ p. 199)', () => {
  it('com 0 PV, rola: 10+ sucesso, abaixo falha; 3 sucessos estabiliza', () => {
    let p = caido()
    expect(situacaoDaMorte(p)).toBe('morrendo')
    p = salvamentoContraMorte(p, 12)
    p = salvamentoContraMorte(p, 4)
    expect(p.estado.morte).toEqual({ sucessos: 1, falhas: 1 })
    p = salvamentoContraMorte(salvamentoContraMorte(p, 10), 15)
    expect(situacaoDaMorte(p)).toBe('estavel')
  })

  it('1 natural conta duas falhas; 3 falhas é morte', () => {
    let p = salvamentoContraMorte(caido(), 1)
    expect(p.estado.morte.falhas).toBe(2)
    p = salvamentoContraMorte(p, 5)
    expect(situacaoDaMorte(p)).toBe('morto')
  })

  it('20 natural volta com 1 PV e zera os testes', () => {
    const p = salvamentoContraMorte(salvamentoContraMorte(caido(), 3), 20)
    expect(p.estado.pvAtual).toBe(1)
    expect(p.estado.morte).toEqual({ sucessos: 0, falhas: 0 })
  })

  it('dano com 0 PV é falha (crítico, duas); dano que passa do PV máximo é morte instantânea', () => {
    expect(aplicarDano(caido(), 3).estado.morte.falhas).toBe(1)
    expect(aplicarDano(caido(), 3, true).estado.morte.falhas).toBe(2)
    expect(situacaoDaMorte(aplicarDano(novo(), PV + PV))).toBe('morto')
    expect(situacaoDaMorte(aplicarDano(novo(), PV + PV - 1))).toBe('morrendo')
  })

  it('curar sai do 0 e zera; marcar à mão fica entre 0 e 3', () => {
    const p = curar(salvamentoContraMorte(caido(), 4), 5)
    expect(p.estado.morte).toEqual({ sucessos: 0, falhas: 0 })
    expect(marcarMorte(caido(), 'falhas', 7).estado.morte.falhas).toBe(3)
  })
})

describe('condições, exaustão e concentração', () => {
  it('agarrado zera o deslocamento; tirar a condição devolve', () => {
    const p = alternarCondicao(novo(), 'agarrado')
    expect(calcularFicha(p).deslocamento).toBe(0)
    expect(calcularFicha(alternarCondicao(p, 'agarrado')).deslocamento).toBe(9)
  })

  it('exaustão: 2 corta o deslocamento, 4 corta o PV máximo, 5 zera o deslocamento', () => {
    expect(calcularFicha(definirExaustao(novo(), 2)).deslocamento).toBe(4.5)
    expect(calcularFicha(definirExaustao(novo(), 4)).pvMaximo).toBe(Math.floor(PV / 2))
    expect(calcularFicha(definirExaustao(novo(), 5)).deslocamento).toBe(0)
    expect(definirExaustao(novo(), 9).estado.exaustao).toBe(6)
  })

  it('descanso longo tira um nível de exaustão e encerra a concentração', () => {
    const p = descansoLongo(iniciarConcentracao(definirExaustao(novo(), 3), 'bencao'))
    expect(p.estado.exaustao).toBe(2)
    expect(p.estado.concentracao).toBeNull()
    expect(encerrarConcentracao(iniciarConcentracao(novo(), 'bencao')).estado.concentracao).toBeNull()
  })
})
