import type { ComponentType } from 'react'
import type { FichaCalculada } from '../../../../regras/dnd5e/motor/ficha'
import type { DefinicaoBloco } from '../../../../layout/layout'
import type { PropsBloco } from '../contexto'
import { BlocoClasse } from './Classe'
import { BlocoAtaques } from './Combate'
import { BlocoConjuracao } from './Magias'
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

/** Abas da ficha, na ordem em que aparecem. */
export const SECOES = [
  { id: 'geral', titulo: 'Geral' },
  { id: 'combate', titulo: 'Combate' },
  { id: 'pericias', titulo: 'Perícias' },
  { id: 'magias', titulo: 'Magias' },
  { id: 'habilidades', titulo: 'Habilidades' },
  { id: 'inventario', titulo: 'Inventário' },
  { id: 'historia', titulo: 'História' },
] as const
export type IdSecao = (typeof SECOES)[number]['id']
export const IDS_SECOES: string[] = SECOES.map((s) => s.id)

const b = (
  secao: IdSecao,
  id: string,
  titulo: string,
  estreita: number,
  larga: number,
  componente: ComponentType<PropsBloco>,
  extra: Partial<Bloco> = {},
): Bloco => ({ id, titulo, secao, largura: { estreita, larga }, componente, ...extra })

/** Ordem e largura padrão dos blocos (larga = 12 colunas, estreita = 6). */
export const BLOCOS: Bloco[] = [
  // Geral: o que se olha o tempo todo na mesa.
  b('geral', 'pv', 'Pontos de vida', 6, 4, BlocoPV),
  b('geral', 'ca', 'CA', 2, 2, BlocoCA, { compacto: true }),
  b('geral', 'iniciativa', 'Iniciativa', 2, 2, BlocoIniciativa, { compacto: true }),
  b('geral', 'deslocamento', 'Deslocamento', 2, 2, BlocoDeslocamento, { compacto: true }),
  b('geral', 'proficiencia', 'Proficiência', 2, 2, BlocoProficiencia, { compacto: true }),
  b('geral', 'dadosDeVida', 'Dados de vida', 2, 2, BlocoDadosDeVida, { compacto: true }),
  b('geral', 'inspiracao', 'Inspiração', 2, 2, BlocoInspiracao, { compacto: true }),
  b('geral', 'atributos', 'Atributos', 6, 8, BlocoAtributos),
  b('geral', 'resistencias', 'Testes de resistência', 6, 4, BlocoResistencias),
  // Combate
  b('combate', 'ataques', 'Ataques', 6, 8, BlocoAtaques),
  b('combate', 'classe', 'Recursos de classe', 6, 4, BlocoClasse),
  // Perícias
  b('pericias', 'pericias', 'Perícias', 6, 6, BlocoPericias),
  b('pericias', 'proficiencias', 'Proficiências e defesas', 6, 6, BlocoProficiencias),
  // Magias (só para quem conjura)
  b('magias', 'conjuracao', 'Magias', 6, 12, BlocoConjuracao, { disponivel: (f) => f.conjuracao !== null }),
  // Habilidades
  b('habilidades', 'habilidades', 'Habilidades e traços', 6, 12, BlocoHabilidades),
  // Inventário
  b('inventario', 'itens', 'Itens', 6, 6, BlocoItens),
  b('inventario', 'moedas', 'Moedas', 6, 3, BlocoMoedas),
  b('inventario', 'carga', 'Carga', 6, 3, BlocoCarga),
  // História
  b('historia', 'identidade', 'Identidade', 6, 4, BlocoIdentidade),
  b('historia', 'objetivo', 'Objetivo e passado', 6, 8, BlocoObjetivo),
  b('historia', 'personalidade', 'Personalidade', 6, 6, BlocoPersonalidade),
  b('historia', 'aparencia', 'Aparência', 6, 6, BlocoAparencia),
  b('historia', 'anotacoes', 'Anotações', 6, 12, BlocoAnotacoes),
]

export function blocosDisponiveis(f: FichaCalculada): Bloco[] {
  return BLOCOS.filter((x) => !x.disponivel || x.disponivel(f))
}
