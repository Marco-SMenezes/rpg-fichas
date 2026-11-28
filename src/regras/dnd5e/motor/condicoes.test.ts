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
  motivoDeCondicoes,
  motivoParaNaoAtacar,
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
    expect(situacaoDaMorte(salvamentoContraMorte(p, 10))).toBe('morrendo')
  })

  it('o terceiro sucesso estabiliza e a vida volta sozinha: 1 PV e os testes zerados', () => {
    let p = caido()
    for (const d20 of [12, 4, 10]) p = salvamentoContraMorte(p, d20)
    expect(p.estado.morte).toEqual({ sucessos: 2, falhas: 1 })
    expect(p.estado.pvAtual).toBe(0)
    p = salvamentoContraMorte(p, 15)
    expect(p.estado.pvAtual).toBe(1)
    expect(p.estado.morte).toEqual({ sucessos: 0, falhas: 0 })
    expect(situacaoDaMorte(p)).toBe('consciente')
  })

  it('marcar o terceiro sucesso à mão também devolve 1 PV', () => {
    const p = marcarMorte(marcarMorte(caido(), 'sucessos', 2), 'sucessos', 3)
    expect(p.estado.pvAtual).toBe(1)
    expect(p.estado.morte).toEqual({ sucessos: 0, falhas: 0 })
  })

  it('com três falhas ninguém volta, nem com três sucessos marcados', () => {
    const p = marcarMorte(marcarMorte(caido(), 'falhas', 3), 'sucessos', 3)
    expect(situacaoDaMorte(p)).toBe('morto')
    expect(p.estado.pvAtual).toBe(0)
  })

  it('marcar sucessos de quem está consciente não muda a vida', () => {
    const p = marcarMorte(novo(), 'sucessos', 3)
    expect(p.estado.pvAtual).toBe(PV)
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

describe('vida com + e −', () => {
  it('menos é dano (primeiro nos temporários), mais cura até o máximo e o resto vira temporário', async () => {
    const { ajustarPV, definirVidaTotal } = await import('./progressao')
    let p = ajustarPV(novo(), -3)
    expect(p.estado.pvAtual).toBe(PV - 3)
    p = ajustarPV(p, 2)
    expect([p.estado.pvAtual, p.estado.pvTemporario]).toEqual([PV - 1, 0])
    p = ajustarPV(p, 4)
    expect([p.estado.pvAtual, p.estado.pvTemporario]).toEqual([PV, 3])
    p = ajustarPV(p, -2)
    expect([p.estado.pvAtual, p.estado.pvTemporario]).toEqual([PV, 1])
    p = definirVidaTotal(p, 5)
    expect([p.estado.pvAtual, p.estado.pvTemporario]).toEqual([5, 0])
    p = definirVidaTotal(p, PV + 2)
    expect([p.estado.pvAtual, p.estado.pvTemporario]).toEqual([PV, 2])
  })
})

describe('quem está caído não ataca', () => {
  it('consciente pode atacar', () => {
    expect(motivoParaNaoAtacar(novo())).toBeNull()
  })
  it('com 0 PV, morrendo ou morto, não pode, e o motivo diz por quê', () => {
    expect(motivoParaNaoAtacar(caido())).toMatch(/0 PV.*não pode atacar/i)
    expect(motivoParaNaoAtacar(marcarMorte(caido(), 'falhas', 3))).toMatch(/morto/i)
  })
  it('curado volta a poder atacar', () => {
    expect(motivoParaNaoAtacar(curar(caido(), 1))).toBeNull()
  })
  it('o terceiro sucesso devolve 1 PV, então também volta a poder atacar', () => {
    expect(motivoParaNaoAtacar(marcarMorte(caido(), 'sucessos', 3))).toBeNull()
  })
})

describe('condições que tiram as ações também impedem de atacar', () => {
  const com = (...ids: string[]) => ids.reduce((p, id) => alternarCondicao(p, id), novo())

  it.each(['atordoado', 'paralisado', 'petrificado', 'inconsciente', 'incapacitado'])('%s não ataca', (id) => {
    expect(motivoParaNaoAtacar(com(id))).toMatch(/não pode atacar/i)
  })

  it('o motivo cita a condição', () => {
    expect(motivoParaNaoAtacar(com('paralisado'))).toMatch(/Paralisado/)
  })

  it.each(['amedrontado', 'cego', 'envenenado', 'caido', 'agarrado', 'impedido', 'enfeiticado', 'invisivel', 'surdo'])(
    '%s ainda ataca (só atrapalha)',
    (id) => {
      expect(motivoParaNaoAtacar(com(id))).toBeNull()
    },
  )

  it('tirar a condição libera o ataque', () => {
    expect(motivoParaNaoAtacar(alternarCondicao(com('atordoado'), 'atordoado'))).toBeNull()
  })

  it('com 0 PV o motivo é a queda, mesmo com a condição marcada', () => {
    expect(motivoParaNaoAtacar(alternarCondicao(caido(), 'atordoado'))).toMatch(/0 PV/)
  })
})

describe('motivoDeCondicoes (monstros e linhas do combate, que guardam o nome)', () => {
  it('acha a condição pelo nome ou pelo id', () => {
    expect(motivoDeCondicoes(['Envenenado', 'Atordoado'])).toMatch(/Atordoado/)
    expect(motivoDeCondicoes(['paralisado'])).toMatch(/Paralisado/)
  })
  it('sem condição que incapacita, devolve null', () => {
    expect(motivoDeCondicoes(['Cego', 'Amedrontado'])).toBeNull()
    expect(motivoDeCondicoes([])).toBeNull()
  })
})
