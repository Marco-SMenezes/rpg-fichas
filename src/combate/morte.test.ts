import { describe, expect, it } from 'vitest'
import { calcularFicha } from '../regras/dnd5e/motor/ficha'
import { criarPersonagem, type EscolhasDeCriacao } from '../regras/dnd5e/motor/criacao'
import { aplicarDano, curar, marcarMorte } from '../regras/dnd5e/motor/progressao'
import { fichaTravadaPeloCombate, mortoNaLinha } from './morte'

const escolhas: EscolhasDeCriacao = {
  nome: 'T', conceito: '', jogador: '', racaId: 'humano', subracaId: null, classeId: 'guerreiro', antecedenteId: 'soldado',
  metodoAtributos: 'manual', atributosBase: { for: 15, des: 13, con: 14, int: 10, sab: 12, car: 8 },
  periciasEscolhidas: ['atletismo', 'percepcao'], especializacoes: [], ferramentasEscolhidas: [], idiomasEscolhidos: [], equipamento: {},
  escolhasDeClasse: { estiloDeLuta: 'defesa' },
}
const vivo = () => criarPersonagem(escolhas)
const caido = () => aplicarDano(vivo(), calcularFicha(vivo()).pvMaximo)
const morto = () => marcarMorte(caido(), 'falhas', 3)

describe('mortoNaLinha (a linha do jogador no combate)', () => {
  it('três falhas com 0 PV é morto neste combate', () => {
    expect(mortoNaLinha({ tipo: 'jogador', pv: 0, morte_falhas: 3 })).toBe(true)
  })
  it('duas falhas ainda está morrendo', () => {
    expect(mortoNaLinha({ tipo: 'jogador', pv: 0, morte_falhas: 2 })).toBe(false)
  })
  it('monstro nunca é travado por isso', () => {
    expect(mortoNaLinha({ tipo: 'monstro', pv: 0, morte_falhas: 3 })).toBe(false)
  })
  it('com PV de volta (o mestre trouxe) deixa de ser morto, mesmo que as falhas ainda não tenham zerado na linha', () => {
    expect(mortoNaLinha({ tipo: 'jogador', pv: 1, morte_falhas: 3 })).toBe(false)
  })
  it('linha sem os dados (null) não é morta', () => {
    expect(mortoNaLinha({ tipo: 'jogador', pv: null, morte_falhas: null })).toBe(false)
  })
})

describe('fichaTravadaPeloCombate (a ficha só trava enquanto está num combate)', () => {
  it('morta e com linha de jogador no combate: trava', () => {
    const p = morto()
    expect(fichaTravadaPeloCombate(p, [{ tipo: 'jogador', personagem_id: p.id }])).toBe(true)
  })
  it('morta, mas sem linha em combate (acabou ou o mestre a tirou): destrava', () => {
    expect(fichaTravadaPeloCombate(morto(), [])).toBe(false)
  })
  it('a linha é de outra ficha: não trava', () => {
    expect(fichaTravadaPeloCombate(morto(), [{ tipo: 'jogador', personagem_id: 'outra' }])).toBe(false)
  })
  it('ficha do mestre escondida no combate (linha de monstro) não trava', () => {
    const p = morto()
    expect(fichaTravadaPeloCombate(p, [{ tipo: 'monstro', personagem_id: p.id }])).toBe(false)
  })
  it('viva, morrendo ou curada: não trava', () => {
    const p = vivo()
    const linhas = [{ tipo: 'jogador' as const, personagem_id: p.id }]
    expect(fichaTravadaPeloCombate(p, linhas)).toBe(false)
    expect(fichaTravadaPeloCombate(marcarMorte(caido(), 'falhas', 2), linhas.map((l) => ({ ...l, personagem_id: caido().id })))).toBe(false)
    expect(fichaTravadaPeloCombate(curar(morto(), 1), linhas)).toBe(false)
  })
})
