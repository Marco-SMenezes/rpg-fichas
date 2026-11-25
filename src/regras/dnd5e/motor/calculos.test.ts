import { describe, expect, it } from 'vitest'
import { ARMADURAS } from '../dados/equipamento'
import { espacosDeMagia } from '../dados/magia'
import { dadosAtaqueFurtivo } from '../dados/ladino'
import {
  ataqueMagia,
  bonusProficiencia,
  bonusTeste,
  capacidadeDeCarga,
  cdMagia,
  classeDeArmadura,
  dadosDeVidaRecuperados,
  modificador,
  percepcaoPassiva,
  pvMaximo,
  pvMedioPorNivel,
  pvPrimeiroNivel,
} from './calculos'

const armadura = (id: string) => ARMADURAS.find((a) => a.id === id)!

describe('modificador de atributo (LdJ p. 13)', () => {
  it.each([
    [1, -5],
    [3, -4],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [12, 1],
    [15, 2],
    [17, 3],
    [20, 5],
    [30, 10],
  ])('valor %i → %i', (valor, esperado) => {
    expect(modificador(valor)).toBe(esperado)
  })
})

describe('bônus de proficiência por nível (LdJ p. 15)', () => {
  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [12, 4],
    [13, 5],
    [16, 5],
    [17, 6],
    [20, 6],
  ])('nível %i → +%i', (nivel, esperado) => {
    expect(bonusProficiencia(nivel)).toBe(esperado)
  })
})

describe('perícias e testes de resistência', () => {
  it('sem proficiência usa só o modificador', () => {
    expect(bonusTeste(3, 2, 0)).toBe(3)
  })
  it('proficiente soma o bônus', () => {
    expect(bonusTeste(3, 2, 1)).toBe(5)
  })
  it('especialização dobra o bônus de proficiência', () => {
    expect(bonusTeste(3, 2, 2)).toBe(7)
    expect(bonusTeste(4, 6, 2)).toBe(16)
  })
  it('modificador negativo continua valendo', () => {
    expect(bonusTeste(-1, 2, 1)).toBe(1)
  })
  it('percepção passiva = 10 + bônus', () => {
    expect(percepcaoPassiva(5)).toBe(15)
  })
})

describe('classe de armadura (LdJ p. 14 e 147)', () => {
  it('sem armadura: 10 + Des', () => {
    expect(classeDeArmadura(3, null, false)).toBe(13)
  })
  it('armadura leve soma toda a Des', () => {
    expect(classeDeArmadura(4, armadura('couro'), false)).toBe(15)
    expect(classeDeArmadura(4, armadura('couroBatido'), false)).toBe(16)
  })
  it('armadura média limita a Des em +2', () => {
    expect(classeDeArmadura(4, armadura('camisaoDeMalha'), false)).toBe(15)
    expect(classeDeArmadura(1, armadura('camisaoDeMalha'), false)).toBe(14)
  })
  it('armadura pesada ignora a Des', () => {
    expect(classeDeArmadura(3, armadura('cotaDeMalha'), false)).toBe(16)
    expect(classeDeArmadura(-1, armadura('placas'), false)).toBe(18)
  })
  it('escudo soma +2', () => {
    expect(classeDeArmadura(2, null, true)).toBe(14)
    expect(classeDeArmadura(2, armadura('couro'), true)).toBe(15)
  })
})

describe('pontos de vida (LdJ p. 12 e 90)', () => {
  it('1º nível: máximo do dado + Con', () => {
    expect(pvPrimeiroNivel(8, 2)).toBe(10)
    expect(pvPrimeiroNivel(8, -1)).toBe(7)
  })
  it('valor fixo por nível: d8 → 5, d10 → 6, d12 → 7, d6 → 4', () => {
    expect(pvMedioPorNivel(8)).toBe(5)
    expect(pvMedioPorNivel(10)).toBe(6)
    expect(pvMedioPorNivel(12)).toBe(7)
    expect(pvMedioPorNivel(6)).toBe(4)
  })
  it('subida de nível soma dado + Con a cada nível', () => {
    // Ladino Con +1: 9 no 1º, +5+1 no 2º, +3+1 no 3º
    expect(pvMaximo(8, 1, [5, 3])).toBe(19)
  })
  it('mudar a Con muda os PV de todos os níveis (p. 179)', () => {
    expect(pvMaximo(8, 2, [5, 3])).toBe(22)
  })
})

describe('magia (LdJ p. 207)', () => {
  it('CD = 8 + proficiência + modificador', () => {
    expect(cdMagia(2, 3)).toBe(13)
    expect(cdMagia(6, 5)).toBe(19)
  })
  it('ataque = proficiência + modificador', () => {
    expect(ataqueMagia(2, 3)).toBe(5)
  })
})

describe('espaços de magia', () => {
  it('conjurador completo (p. 167)', () => {
    expect(espacosDeMagia('completo', 1)).toEqual([2])
    expect(espacosDeMagia('completo', 3)).toEqual([4, 2])
    expect(espacosDeMagia('completo', 5)).toEqual([4, 3, 2])
    expect(espacosDeMagia('completo', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1])
  })
  it('meio conjurador não tem espaços no 1º nível', () => {
    expect(espacosDeMagia('meio', 1)).toEqual([])
    expect(espacosDeMagia('meio', 2)).toEqual([2])
    expect(espacosDeMagia('meio', 9)).toEqual([4, 3, 2])
  })
  it('um terço de conjurador começa no 3º nível (Trapaceiro Arcano, p. 93)', () => {
    expect(espacosDeMagia('terco', 2)).toEqual([])
    expect(espacosDeMagia('terco', 3)).toEqual([2])
    expect(espacosDeMagia('terco', 7)).toEqual([4, 2])
    expect(espacosDeMagia('terco', 19)).toEqual([4, 3, 3, 1])
  })
})

describe('carga (LdJ p. 178)', () => {
  it('capacidade = Força × 7,5 kg; arrastar = Força × 15', () => {
    expect(capacidadeDeCarga(10)).toEqual({ carga: 75, arrastar: 150 })
    expect(capacidadeDeCarga(15)).toEqual({ carga: 112.5, arrastar: 225 })
  })
})

describe('ladino', () => {
  it.each([
    [1, 1],
    [2, 1],
    [3, 2],
    [5, 3],
    [10, 5],
    [11, 6],
    [19, 10],
    [20, 10],
  ])('Ataque Furtivo no nível %i: %id6 (p. 90)', (nivel, dados) => {
    expect(dadosAtaqueFurtivo(nivel)).toBe(dados)
  })
})

describe('descanso longo', () => {
  it('recupera metade dos dados de vida, mínimo 1', () => {
    expect(dadosDeVidaRecuperados(1)).toBe(1)
    expect(dadosDeVidaRecuperados(8)).toBe(4)
    expect(dadosDeVidaRecuperados(5)).toBe(2)
  })
})
