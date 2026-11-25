import type { ComponentType } from 'react'
import type { FichaCalculada } from '../../../../regras/dnd5e/motor/ficha'
import type { DefinicaoBloco } from '../../../../layout/layout'
import type { PropsBloco } from '../contexto'
import { BlocoAtaques, BlocoConjuracao } from './Combate'
import { BlocoHabilidades } from './Habilidades'
import { BlocoCarga, BlocoItens, BlocoMoedas } from './Inventario'
import { BlocoAnotacoes, BlocoAparencia, BlocoIdentidade, BlocoObjetivo, BlocoPersonalidade, BlocoProficiencias } from './Notas'
import { BlocoAtributos, BlocoPericias, BlocoResistencias } from './Pericias'
import { BlocoCA, BlocoDadosDeVida, BlocoDeslocamento, BlocoInspiracao, BlocoIniciativa, BlocoProficiencia, BlocoPV } from './Vitais'

export interface Bloco extends DefinicaoBloco {
  titulo: string
  componente: ComponentType<PropsBloco>
  /** Bloco que só existe em algumas fichas (ex.: conjuração). */
  disponivel?: (f: FichaCalculada) => boolean
  /** Blocos pequenos de um número só: título menor e sem margem extra. */
  compacto?: boolean
}

const b = (
  id: string,
  titulo: string,
  estreita: number,
  larga: number,
  componente: ComponentType<PropsBloco>,
  extra: Partial<Bloco> = {},
): Bloco => ({ id, titulo, largura: { estreita, larga }, componente, ...extra })

/** Ordem e largura padrão dos blocos (larga = 12 colunas, estreita = 6). */
export const BLOCOS: Bloco[] = [
  b('pv', 'Pontos de vida', 6, 4, BlocoPV),
  b('ca', 'CA', 2, 2, BlocoCA, { compacto: true }),
  b('iniciativa', 'Iniciativa', 2, 2, BlocoIniciativa, { compacto: true }),
  b('deslocamento', 'Deslocamento', 2, 2, BlocoDeslocamento, { compacto: true }),
  b('proficiencia', 'Proficiência', 2, 2, BlocoProficiencia, { compacto: true }),
  b('dadosDeVida', 'Dados de vida', 2, 2, BlocoDadosDeVida, { compacto: true }),
  b('inspiracao', 'Inspiração', 2, 2, BlocoInspiracao, { compacto: true }),
  b('atributos', 'Atributos', 6, 8, BlocoAtributos),
  b('ataques', 'Ataques', 6, 8, BlocoAtaques),
  b('resistencias', 'Testes de resistência', 6, 4, BlocoResistencias),
  b('conjuracao', 'Conjuração', 6, 12, BlocoConjuracao, { disponivel: (f) => f.conjuracao !== null }),
  b('pericias', 'Perícias', 6, 4, BlocoPericias),
  b('habilidades', 'Habilidades e traços', 6, 8, BlocoHabilidades),
  b('itens', 'Itens', 6, 6, BlocoItens),
  b('moedas', 'Moedas', 6, 3, BlocoMoedas),
  b('carga', 'Carga', 6, 3, BlocoCarga),
  b('objetivo', 'Objetivo e passado', 6, 6, BlocoObjetivo),
  b('personalidade', 'Personalidade', 6, 6, BlocoPersonalidade),
  b('aparencia', 'Aparência', 6, 6, BlocoAparencia),
  b('proficiencias', 'Proficiências e defesas', 6, 6, BlocoProficiencias),
  b('anotacoes', 'Anotações', 6, 8, BlocoAnotacoes),
  b('identidade', 'Identidade', 6, 4, BlocoIdentidade),
]

export function blocosDisponiveis(f: FichaCalculada): Bloco[] {
  return BLOCOS.filter((x) => !x.disponivel || x.disponivel(f))
}
