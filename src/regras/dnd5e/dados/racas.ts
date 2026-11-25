import type { AncestralDraconico, Habilidade, Raca } from '../tipos'

/** Raças do Livro do Jogador (cap. 2). Resumos em palavras próprias. */

const t = (id: string, nome: string, resumo: string, pagina: number): Habilidade => ({ id, nome, resumo, pagina })

const visao = (raca: string, pagina: number, alcance = 18) =>
  t(`${raca}-visao`, 'Visão no Escuro', `Enxerga na penumbra a até ${alcance} m como em luz plena, e no escuro como penumbra (sem cores).`, pagina)

export const ANAO: Raca = {
  id: 'anao',
  nome: 'Anão',
  pagina: 18,
  tamanho: 'Médio',
  deslocamento: 7.5,
  ignoraForcaArmadura: true,
  aumentos: { con: 2 },
  idiomas: ['Comum', 'Anão'],
  pericias: [],
  armas: ['machadoDeBatalha', 'machadinha', 'marteloLeve', 'marteloDeGuerra'],
  escolhaFerramenta: {
    rotulo: 'Ferramenta de artesão',
    opcoes: ['Ferramentas de ferreiro', 'Suprimentos de cervejeiro', 'Ferramentas de pedreiro'],
  },
  resistenciasDano: ['veneno'],
  visaoNoEscuro: 18,
  tracos: [
    t('anao-deslocamento', 'Deslocamento', '7,5 m, e armadura pesada não reduz o deslocamento.', 20),
    visao('anao', 20),
    t('anao-resiliencia', 'Resiliência Anã', 'Vantagem em resistências contra veneno e resistência a dano de veneno.', 20),
    t('anao-combate', 'Treinamento Anão em Combate', 'Proficiência com machado de batalha, machadinha, martelo leve e martelo de guerra.', 20),
    t('anao-ferramenta', 'Proficiência com Ferramentas', 'Uma ferramenta de artesão à escolha: ferreiro, cervejeiro ou pedreiro.', 21),
    t('anao-rochas', 'Especialização em Rochas', 'Em testes de História sobre a origem de trabalhos em pedra, conta como proficiente e dobra o bônus.', 21),
  ],
  subracas: [
    {
      id: 'anao-colina',
      nome: 'Anão da colina',
      pagina: 21,
      aumentos: { sab: 1 },
      pericias: [],
      armas: [],
      pvPorNivel: 1,
      tracos: [t('anao-colina-tenacidade', 'Tenacidade Anã', '+1 PV máximo por nível de personagem.', 21)],
    },
    {
      id: 'anao-montanha',
      nome: 'Anão da montanha',
      pagina: 21,
      aumentos: { for: 2 },
      pericias: [],
      armas: [],
      armaduras: ['leve', 'media'],
      tracos: [t('anao-montanha-armaduras', 'Treinamento Anão com Armaduras', 'Proficiência em armaduras leves e médias.', 21)],
    },
  ],
}

const ARMAS_ELFICAS = ['espadaLonga', 'espadaCurta', 'arcoLongo', 'arcoCurto']

export const ELFO: Raca = {
  id: 'elfo',
  nome: 'Elfo',
  pagina: 21,
  tamanho: 'Médio',
  deslocamento: 9,
  aumentos: { des: 2 },
  idiomas: ['Comum', 'Élfico'],
  pericias: ['percepcao'],
  armas: [],
  visaoNoEscuro: 18,
  tracos: [
    visao('elfo', 23),
    t('elfo-sentidos', 'Sentidos Aguçados', 'Proficiência em Percepção.', 23),
    t('elfo-ancestral', 'Ancestral Feérico', 'Vantagem em resistências contra ficar enfeitiçado; magia não o põe para dormir.', 23),
    t('elfo-transe', 'Transe', 'Não dorme: medita 4 horas e recebe o mesmo benefício de 8 horas de sono.', 23),
  ],
  subracas: [
    {
      id: 'elfo-alto',
      nome: 'Alto elfo',
      pagina: 23,
      aumentos: { int: 1 },
      pericias: [],
      armas: ARMAS_ELFICAS,
      idiomasExtras: 1,
      tracos: [
        t('elfo-alto-armas', 'Treinamento Élfico com Armas', 'Proficiência com espada longa, espada curta, arco longo e arco curto.', 23),
        t('elfo-alto-truque', 'Truque', 'Conhece um truque de mago à escolha; conjura com Inteligência.', 24),
        t('elfo-alto-idioma', 'Idioma Adicional', 'Um idioma a mais, à escolha.', 24),
      ],
    },
    {
      id: 'elfo-floresta',
      nome: 'Elfo da floresta',
      pagina: 24,
      aumentos: { sab: 1 },
      deslocamento: 10.5,
      pericias: [],
      armas: ARMAS_ELFICAS,
      tracos: [
        t('elfo-floresta-armas', 'Treinamento Élfico com Armas', 'Proficiência com espada longa, espada curta, arco longo e arco curto.', 24),
        t('elfo-floresta-pes', 'Pés Ligeiros', 'Deslocamento base de 10,5 m.', 24),
        t(
          'elfo-floresta-mascara',
          'Máscara da Natureza',
          'Pode tentar se esconder quando só está levemente encoberto por fenômenos naturais (folhagem, chuva, neve, névoa).',
          24,
        ),
      ],
    },
    {
      id: 'elfo-drow',
      nome: 'Elfo negro (drow)',
      pagina: 24,
      aumentos: { car: 1 },
      pericias: [],
      armas: ['rapieira', 'espadaCurta', 'bestaDeMao'],
      visaoNoEscuro: 36,
      tracos: [
        t('elfo-drow-visao', 'Visão no Escuro Superior', 'A visão no escuro chega a 36 m.', 24),
        t('elfo-drow-sol', 'Sensibilidade à Luz Solar', 'Desvantagem em ataques e em Percepção pela visão sob luz solar direta.', 24),
        t(
          'elfo-drow-magia',
          'Magia Drow',
          'Truque globos de luz; fogo das fadas no 3º nível e escuridão no 5º, uma vez por descanso longo. Conjura com Carisma.',
          24,
        ),
        t('elfo-drow-armas', 'Treinamento Drow com Armas', 'Proficiência com rapieira, espada curta e besta de mão.', 24),
      ],
    },
  ],
}

export const HALFLING: Raca = {
  id: 'halfling',
  nome: 'Halfling',
  pagina: 26,
  tamanho: 'Pequeno',
  deslocamento: 7.5,
  aumentos: { des: 2 },
  idiomas: ['Comum', 'Halfling'],
  pericias: [],
  armas: [],
  tracos: [
    t('halfling-sortudo', 'Sortudo', 'Ao tirar 1 natural num ataque, teste ou resistência, rola de novo e fica com o novo resultado.', 28),
    t('halfling-bravura', 'Bravura', 'Vantagem em resistências contra ficar amedrontado.', 28),
    t('halfling-agilidade', 'Agilidade Halfling', 'Pode atravessar o espaço de criaturas maiores que você.', 28),
  ],
  subracas: [
    {
      id: 'halfling-pes-leves',
      nome: 'Pés-leves',
      pagina: 28,
      aumentos: { car: 1 },
      pericias: [],
      armas: [],
      tracos: [t('halfling-furtividade', 'Furtividade Natural', 'Pode tentar se esconder atrás de uma criatura ao menos um tamanho maior.', 28)],
    },
    {
      id: 'halfling-robusto',
      nome: 'Robusto',
      pagina: 28,
      aumentos: { con: 1 },
      pericias: [],
      armas: [],
      resistenciasDano: ['veneno'],
      tracos: [t('halfling-resiliencia', 'Resiliência dos Robustos', 'Vantagem em resistências contra veneno e resistência a dano de veneno.', 28)],
    },
  ],
}

export const HUMANO: Raca = {
  id: 'humano',
  nome: 'Humano',
  pagina: 29,
  tamanho: 'Médio',
  deslocamento: 9,
  aumentos: { for: 1, des: 1, con: 1, int: 1, sab: 1, car: 1 },
  idiomas: ['Comum'],
  idiomasExtras: 1,
  pericias: [],
  armas: [],
  tracos: [
    t('humano-atributos', 'Aumento no Valor de Habilidade', '+1 em todos os atributos.', 31),
    t('humano-idioma', 'Idiomas', 'Comum e mais um idioma à escolha.', 31),
  ],
  subracas: [],
}

/** Humano variante: traços alternativos da regra opcional de talentos (LdJ p. 31). */
const HUMANO_VARIANTE: Raca = {
  id: 'humano-variante',
  nome: 'Humano (variante)',
  pagina: 31,
  tamanho: 'Médio',
  deslocamento: 9,
  aumentos: {},
  aumentosEscolha: { quantidade: 2, excluir: [] },
  periciasEscolha: 1,
  talento: true,
  idiomas: ['Comum'],
  idiomasExtras: 1,
  pericias: [],
  armas: [],
  tracos: [
    t('humano-variante-atributos', 'Aumento no Valor de Habilidade', '+1 em dois atributos à escolha.', 31),
    t('humano-variante-pericia', 'Perícia', 'Proficiência numa perícia à escolha.', 31),
    t('humano-variante-talento', 'Talento', 'Um talento à escolha (regra opcional; combine com o Mestre).', 31),
    t('humano-idioma', 'Idiomas', 'Comum e mais um idioma à escolha.', 31),
  ],
  subracas: [],
}

export const ANCESTRAIS_DRACONICOS: AncestralDraconico[] = [
  { id: 'azul', nome: 'Azul', dano: 'elétrico', area: 'Linha de 1,5 × 9 m', teste: 'des' },
  { id: 'branco', nome: 'Branco', dano: 'frio', area: 'Cone de 4,5 m', teste: 'con' },
  { id: 'bronze', nome: 'Bronze', dano: 'elétrico', area: 'Linha de 1,5 × 9 m', teste: 'des' },
  { id: 'cobre', nome: 'Cobre', dano: 'ácido', area: 'Linha de 1,5 × 9 m', teste: 'des' },
  { id: 'latao', nome: 'Latão', dano: 'fogo', area: 'Linha de 1,5 × 9 m', teste: 'des' },
  { id: 'negro', nome: 'Negro', dano: 'ácido', area: 'Linha de 1,5 × 9 m', teste: 'des' },
  { id: 'ouro', nome: 'Ouro', dano: 'fogo', area: 'Cone de 4,5 m', teste: 'des' },
  { id: 'prata', nome: 'Prata', dano: 'frio', area: 'Cone de 4,5 m', teste: 'con' },
  { id: 'verde', nome: 'Verde', dano: 'veneno', area: 'Cone de 4,5 m', teste: 'con' },
  { id: 'vermelho', nome: 'Vermelho', dano: 'fogo', area: 'Cone de 4,5 m', teste: 'des' },
]

export const DRACONATO: Raca = {
  id: 'draconato',
  nome: 'Draconato',
  pagina: 32,
  tamanho: 'Médio',
  deslocamento: 9,
  aumentos: { for: 2, car: 1 },
  idiomas: ['Comum', 'Dracônico'],
  pericias: [],
  armas: [],
  ancestrais: ANCESTRAIS_DRACONICOS,
  tracos: [
    t('draconato-ancestral', 'Ancestral Dracônico', 'A cor do dragão ancestral define o tipo de dano do sopro e da resistência.', 34),
    t(
      'draconato-sopro',
      'Arma de Sopro',
      'Ação: sopro na área do ancestral; resistência com CD 8 + Con + proficiência, metade do dano se passar. 2d6, subindo para 3d6 (6º), 4d6 (11º) e 5d6 (16º). Recarrega em descanso curto ou longo.',
      34,
    ),
    t('draconato-resistencia', 'Resistência a Dano', 'Resistência ao tipo de dano do ancestral.', 34),
  ],
  subracas: [],
}

/** Dados do sopro do draconato por nível (LdJ p. 34). */
export function dadosSopro(nivel: number): number {
  return nivel >= 16 ? 5 : nivel >= 11 ? 4 : nivel >= 6 ? 3 : 2
}

export const GNOMO: Raca = {
  id: 'gnomo',
  nome: 'Gnomo',
  pagina: 35,
  tamanho: 'Pequeno',
  deslocamento: 7.5,
  aumentos: { int: 2 },
  idiomas: ['Comum', 'Gnômico'],
  pericias: [],
  armas: [],
  visaoNoEscuro: 18,
  tracos: [
    visao('gnomo', 36),
    t('gnomo-esperteza', 'Esperteza Gnômica', 'Vantagem em resistências de Inteligência, Sabedoria e Carisma contra magia.', 36),
  ],
  subracas: [
    {
      id: 'gnomo-floresta',
      nome: 'Gnomo da floresta',
      pagina: 37,
      aumentos: { des: 1 },
      pericias: [],
      armas: [],
      tracos: [
        t('gnomo-ilusionista', 'Ilusionista Nato', 'Conhece o truque ilusão menor; conjura com Inteligência.', 37),
        t('gnomo-bestas', 'Falar com Bestas Pequenas', 'Comunica ideias simples a bestas pequenas ou menores.', 37),
      ],
    },
    {
      id: 'gnomo-rochas',
      nome: 'Gnomo das rochas',
      pagina: 37,
      aumentos: { con: 1 },
      pericias: [],
      armas: [],
      ferramentas: ['Ferramentas de engenhoqueiro'],
      tracos: [
        t('gnomo-artifice', 'Conhecimento de Artífice', 'Em testes de História sobre itens mágicos, alquímicos ou mecanismos, dobra o bônus de proficiência.', 37),
        t('gnomo-engenhoqueiro', 'Engenhoqueiro', 'Proficiência com ferramentas de engenhoqueiro; monta pequenos aparelhos mecânicos.', 37),
      ],
    },
  ],
}

export const MEIO_ELFO: Raca = {
  id: 'meio-elfo',
  nome: 'Meio-elfo',
  pagina: 38,
  tamanho: 'Médio',
  deslocamento: 9,
  aumentos: { car: 2 },
  aumentosEscolha: { quantidade: 2, excluir: ['car'] },
  idiomas: ['Comum', 'Élfico'],
  idiomasExtras: 1,
  pericias: [],
  periciasEscolha: 2,
  armas: [],
  visaoNoEscuro: 18,
  tracos: [
    t('meio-elfo-atributos', 'Aumento no Valor de Habilidade', 'Carisma +2 e +1 em outros dois atributos à escolha.', 39),
    visao('meio-elfo', 39),
    t('meio-elfo-ancestral', 'Ancestral Feérico', 'Vantagem em resistências contra ficar enfeitiçado; magia não o põe para dormir.', 39),
    t('meio-elfo-versatilidade', 'Versatilidade em Perícia', 'Proficiência em duas perícias à escolha.', 39),
    t('meio-elfo-idioma', 'Idiomas', 'Comum, Élfico e mais um à escolha.', 39),
  ],
  subracas: [],
}

export const MEIO_ORC: Raca = {
  id: 'meio-orc',
  nome: 'Meio-orc',
  pagina: 40,
  tamanho: 'Médio',
  deslocamento: 9,
  aumentos: { for: 2, con: 1 },
  idiomas: ['Comum', 'Orc'],
  pericias: ['intimidacao'],
  armas: [],
  visaoNoEscuro: 18,
  tracos: [
    visao('meio-orc', 41),
    t('meio-orc-ameacador', 'Ameaçador', 'Proficiência em Intimidação.', 41),
    t('meio-orc-implacavel', 'Resistência Implacável', 'Ao cair a 0 PV sem morrer na hora, fica com 1 PV. Uma vez por descanso longo.', 41),
    t('meio-orc-selvagem', 'Ataques Selvagens', 'Num acerto crítico corpo a corpo com arma, rola mais um dado de dano da arma.', 41),
  ],
  subracas: [],
}

export const TIEFLING: Raca = {
  id: 'tiefling',
  nome: 'Tiefling',
  pagina: 42,
  tamanho: 'Médio',
  deslocamento: 9,
  aumentos: { int: 1, car: 2 },
  idiomas: ['Comum', 'Infernal'],
  pericias: [],
  armas: [],
  resistenciasDano: ['fogo'],
  visaoNoEscuro: 18,
  tracos: [
    visao('tiefling', 43),
    t('tiefling-resistencia', 'Resistência Infernal', 'Resistência a dano de fogo.', 43),
    t(
      'tiefling-legado',
      'Legado Infernal',
      'Truque taumaturgia; repreensão infernal (como 2º nível) no 3º nível e escuridão no 5º, uma vez por descanso longo. Conjura com Carisma.',
      43,
    ),
  ],
  subracas: [],
}

export const RACAS: Raca[] = [ANAO, ELFO, HALFLING, HUMANO, HUMANO_VARIANTE, DRACONATO, GNOMO, MEIO_ELFO, MEIO_ORC, TIEFLING]

/** Idiomas do Livro do Jogador (p. 125). */
export const IDIOMAS = {
  padrao: ['Anão', 'Comum', 'Élfico', 'Gigante', 'Gnômico', 'Goblin', 'Halfling', 'Orc'],
  exoticos: ['Abissal', 'Celestial', 'Dialeto Subterrâneo', 'Dracônico', 'Infernal', 'Primordial', 'Silvestre', 'Subcomum'],
}
