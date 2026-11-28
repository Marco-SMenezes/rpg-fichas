/**
 * Fichas prontas para os testes, montadas pelo próprio motor de regras (sem passar pelo assistente de criação).
 * Entram no navegador pelo localStorage: veja `guardarFichas`.
 */
import type { Page } from '@playwright/test'
import { criarEmNivel, primeiraOpcaoLivre, requisitosDoNivel, type EscolhasDeNivel } from '../src/regras/dnd5e/motor/progressao'
import type { EscolhasDeCriacao } from '../src/regras/dnd5e/motor/criacao'
import type { EscolhaDeClasse, Personagem } from '../src/regras/dnd5e/tipos'

const CRIACAO: EscolhasDeCriacao = {
  escolhasDeClasse: { estiloDeLuta: 'defesa' },
  nome: 'Teste',
  conceito: '',
  jogador: '',
  racaId: 'humano',
  subracaId: null,
  classeId: 'guerreiro',
  antecedenteId: 'soldado',
  metodoAtributos: 'manual',
  atributosBase: { for: 15, des: 13, con: 13, int: 9, sab: 11, car: 13 },
  periciasEscolhidas: [],
  especializacoes: [],
  ferramentasEscolhidas: ['Conjunto de dados'],
  idiomasEscolhidos: ['Anão'],
  equipamento: {},
}

function escolherLivres(lista: EscolhaDeClasse[], anteriores: EscolhasDeNivel[]) {
  const ate: Record<string, string> = Object.assign({}, ...anteriores.map((n) => n.escolhas ?? {}))
  for (const e of lista) ate[e.id] = primeiraOpcaoLivre(e, ate)!
  return Object.fromEntries(lista.map((e) => [e.id, ate[e.id]!]))
}

/** Guerreiro humano soldado no nível dado, já com a subclasse escolhida (a partir do 3º nível). */
export function guerreiro(nivel: number, subclasseId = 'campeao'): Personagem {
  const niveis: EscolhasDeNivel[] = []
  for (let n = 2; n <= nivel; n++) {
    const req = requisitosDoNivel('guerreiro', n, n >= 3 ? subclasseId : null)
    niveis.push({
      pv: req.pvMedio,
      subclasseId: req.escolherSubclasse ? subclasseId : undefined,
      incremento: req.incremento ? { for: 1, con: 1 } : undefined,
      escolhas: escolherLivres(req.escolhas, niveis),
    })
  }
  return { ...criarEmNivel(CRIACAO, niveis), id: `guerreiro-${nivel}`, nome: `Guerreiro ${nivel}` }
}

/** Põe as fichas na lista de personagens do aparelho antes de a página abrir. */
export async function guardarFichas(page: Page, fichas: Personagem[]) {
  await page.addInitScript((lista) => localStorage.setItem('tomo:personagens:v1', JSON.stringify(lista)), fichas)
}
