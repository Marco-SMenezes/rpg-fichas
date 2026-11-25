/**
 * Fórmulas básicas do Livro do Jogador 5e (2014). Funções puras, sem interface.
 */
import type { Armadura } from '../tipos'

/** Modificador de atributo (LdJ p. 13 e 175). */
export function modificador(valor: number): number {
  return Math.floor((valor - 10) / 2)
}

/** Bônus de proficiência por nível de personagem (LdJ p. 15). */
export function bonusProficiencia(nivel: number): number {
  return 2 + Math.floor((Math.min(Math.max(nivel, 1), 20) - 1) / 4)
}

/** 0 = sem proficiência, 1 = proficiente, 2 = especialização (dobra). */
export type GrauProficiencia = 0 | 1 | 2

export function bonusTeste(modAtributo: number, proficiencia: number, grau: GrauProficiencia): number {
  return modAtributo + proficiencia * grau
}

/** Percepção passiva = 10 + modificadores do teste (LdJ p. 179). */
export function percepcaoPassiva(bonusPercepcao: number): number {
  return 10 + bonusPercepcao
}

/** CA (LdJ p. 14 e 146): sem armadura 10 + Des; com armadura conforme a tabela; escudo +2. */
export function classeDeArmadura(modDes: number, armadura: Armadura | null, escudo: boolean): number {
  let ca: number
  if (!armadura) {
    ca = 10 + modDes
  } else if (armadura.categoria === 'pesada') {
    ca = armadura.caBase
  } else if (armadura.limiteDes === null) {
    ca = armadura.caBase + modDes
  } else {
    ca = armadura.caBase + Math.min(modDes, armadura.limiteDes)
  }
  return ca + (escudo ? 2 : 0)
}

/** PV no 1º nível: valor máximo do dado de vida + mod. de Constituição (LdJ p. 12). */
export function pvPrimeiroNivel(dadoDeVida: number, modCon: number): number {
  return dadoDeVida + modCon
}

/** Valor fixo por nível: metade do dado + 1 (ex.: d8 → 5). */
export function pvMedioPorNivel(dadoDeVida: number): number {
  return dadoDeVida / 2 + 1
}

/**
 * PV máximos. O mod. de Constituição atual vale para todos os níveis, já que
 * mudar a Constituição altera os PV como se fosse desde o 1º nível (LdJ p. 179).
 */
export function pvMaximo(dadoDeVida: number, modCon: number, ganhosPorNivel: number[]): number {
  const demais = ganhosPorNivel.reduce((total, dado) => total + dado + modCon, 0)
  return Math.max(1, pvPrimeiroNivel(dadoDeVida, modCon) + demais)
}

/** CD para resistir às magias (LdJ p. 207). */
export function cdMagia(proficiencia: number, modAtributo: number): number {
  return 8 + proficiencia + modAtributo
}

/** Modificador de ataque de magia (LdJ p. 207). */
export function ataqueMagia(proficiencia: number, modAtributo: number): number {
  return proficiencia + modAtributo
}

/** Capacidade de carga = Força × 7,5 kg; empurrar/arrastar/levantar = dobro (LdJ p. 178). */
export function capacidadeDeCarga(forca: number): { carga: number; arrastar: number } {
  return { carga: forca * 7.5, arrastar: forca * 15 }
}

/** Dados de vida recuperados num descanso longo: metade do total, mínimo 1. */
export function dadosDeVidaRecuperados(total: number): number {
  return Math.max(1, Math.floor(total / 2))
}
