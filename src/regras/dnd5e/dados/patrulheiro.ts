import type { Classe, EscolhaDeClasse } from '../tipos'
import { escolhaDeEstilo } from './guerreiro'

const opcoes = (lista: [string, string][]) => lista.map(([nome, resumo]) => ({ id: nome, nome, resumo }))

const escolha = (id: string, nivel: number, rotulo: string, pagina: number, lista: [string, string][]): EscolhaDeClasse => ({
  id,
  nivel,
  rotulo,
  pagina,
  opcoes: opcoes(lista),
})

/** Magias conhecidas por nível (tabela do patrulheiro, LdJ p. 116). */
const CONHECIDAS = [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11]

/**
 * Patrulheiro (LdJ p. 115–121). É a versão revisada que está no PDF do Tomo
 * (Biblioteca Élfica), não a do livro impresso de 2014.
 */
export const PATRULHEIRO: Classe = {
  id: 'patrulheiro',
  nome: 'Patrulheiro',
  pagina: 115,
  dadoDeVida: 10,
  resistencias: ['for', 'des'],
  armaduras: ['leve', 'media', 'escudo'],
  armas: { categorias: ['simples', 'marcial'], especificas: [] },
  ferramentas: [],
  pericias: {
    quantidade: 3,
    opcoes: ['adestrarAnimais', 'atletismo', 'furtividade', 'intuicao', 'investigacao', 'natureza', 'percepcao', 'sobrevivencia'],
  },
  equipamentoFixo: [
    { itemId: 'arcoLongo', quantidade: 1 },
    { itemId: 'aljava', quantidade: 1 },
    { itemId: 'flechas', quantidade: 20 },
  ],
  equipamentoEscolhas: [
    {
      id: 'armadura',
      opcoes: [
        { rotulo: 'Brunea', itens: [{ itemId: 'brunea', quantidade: 1 }] },
        { rotulo: 'Armadura de couro', itens: [{ itemId: 'couro', quantidade: 1 }] },
      ],
    },
    {
      id: 'armas',
      opcoes: [
        { rotulo: 'Duas espadas curtas', itens: [{ itemId: 'espadaCurta', quantidade: 2 }] },
        { rotulo: 'Duas armas simples corpo a corpo (iguais)', itens: [{ itemId: 'qualquer:simples-corpo', quantidade: 2 }] },
      ],
    },
    {
      id: 'pacote',
      opcoes: [
        { rotulo: 'Pacote de explorador', itens: [{ itemId: 'pacoteExplorador', quantidade: 1 }] },
        { rotulo: 'Pacote de aventureiro', itens: [{ itemId: 'pacoteAventureiro', quantidade: 1 }] },
      ],
    },
  ],
  escolhas: [
    escolha('inimigoFavorito', 1, 'Inimigo Favorito', 117, [
      ['Bestas', ''],
      ['Fadas', ''],
      ['Humanoides', ''],
      ['Monstruosidades', ''],
      ['Mortos-vivos', ''],
    ]),
    escolhaDeEstilo('estiloDeLuta', 2, 117, ['arquearia', 'defesa', 'duelismo', 'duasArmas']),
    escolha('inimigoFavoritoMaior', 6, 'Inimigo Favorito Maior', 118, [
      ['Aberrações', ''],
      ['Celestiais', ''],
      ['Constructos', ''],
      ['Corruptores', ''],
      ['Dragões', ''],
      ['Elementais', ''],
      ['Gigantes', ''],
    ]),
  ].map((e) => ({ ...e, opcoes: e.opcoes.map((o) => ({ ...o, resumo: o.resumo || 'Bônus no dano e vantagem para rastrear e lembrar informações.' })) })),
  habilidades: [
    { nivel: 1, id: 'patrulheiro-inimigo', nome: 'Inimigo Favorito', pagina: 117, resumo: '+2 no dano com arma contra o tipo escolhido, vantagem para rastreá-lo e lembrar informações sobre ele, e um idioma falado por ele.' },
    { nivel: 1, id: 'patrulheiro-explorador', nome: 'Explorador Natural', pagina: 117, resumo: 'Ignora terreno difícil, vantagem na iniciativa e, no primeiro turno, vantagem contra quem ainda não agiu. Viajando, não se perde e encontra comida com facilidade.' },
    { nivel: 2, id: 'patrulheiro-estilo', nome: 'Estilo de Luta', pagina: 117, resumo: 'Arquearia, Defesa, Duelismo ou Combate com Duas Armas.' },
    { nivel: 2, id: 'patrulheiro-conjuracao', nome: 'Conjuração', pagina: 117, resumo: 'Conhece magias de patrulheiro e conjura com Sabedoria, como meio conjurador.' },
    { nivel: 3, id: 'patrulheiro-conclave', nome: 'Conclave de Patrulheiro', pagina: 118, resumo: 'Escolha do conclave (Besta, Caçador ou Rastreador Subterrâneo), com habilidades no 3º, 5º, 7º, 11º e 15º níveis.' },
    { nivel: 3, id: 'patrulheiro-consciencia', nome: 'Consciência Primitiva', pagina: 118, resumo: 'Comunica ideias simples a bestas e, com 1 minuto de concentração, sente inimigos favoritos a até 1,5 km (9,6 km em seu terreno).' },
    { nivel: 6, id: 'patrulheiro-maior', nome: 'Inimigo Favorito Maior', pagina: 118, resumo: 'Um tipo poderoso a mais como inimigo favorito; o bônus de dano contra todos vira +4 e você tem vantagem em resistências contra magias e habilidades deles.' },
    { nivel: 8, id: 'patrulheiro-pes', nome: 'Pés Rápidos', pagina: 118, resumo: 'Disparada como ação bônus.' },
    { nivel: 10, id: 'patrulheiro-mimetismo', nome: 'Mimetismo', pagina: 118, resumo: 'Escondido e sem se mover no turno, quem tenta percebê-lo sofre −10 em Percepção.' },
    { nivel: 14, id: 'patrulheiro-desaparecer', nome: 'Desaparecer', pagina: 119, resumo: 'Esconder como ação bônus; não pode ser rastreado por meios não mágicos.' },
    { nivel: 18, id: 'patrulheiro-sentidos', nome: 'Sentidos Selvagens', pagina: 119, resumo: 'Sem desvantagem para atacar o que não vê e sabe onde estão criaturas invisíveis a até 9 m.' },
    { nivel: 20, id: 'patrulheiro-matador', nome: 'Matador de Inimigos', pagina: 119, resumo: 'Uma vez por turno, soma Sabedoria no ataque ou no dano.' },
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 3,
  nomeSubclasse: 'Conclave de Patrulheiro',
  conjuracao: { tipo: 'meio', atributo: 'sab' },
  magias: { conhecidas: CONHECIDAS },
  extras: ({ nivel, escolhas }) => [
    {
      nome: 'Dano contra inimigos favoritos',
      valor: `+${nivel >= 6 ? 4 : 2}${escolhas.inimigoFavorito ? ` (${[escolhas.inimigoFavorito, escolhas.inimigoFavoritoMaior].filter(Boolean).join(', ').toLowerCase()})` : ''}`,
    },
  ],
  subclasses: [
    {
      id: 'besta',
      nome: 'Conclave da Besta',
      pagina: 119,
      resumo: 'Um companheiro animal luta ao seu lado.',
      ferramentas: [],
      habilidades: [
        { nivel: 3, id: 'besta-companheiro', nome: 'Companheiro Animal', pagina: 119, resumo: '8 horas e 50 po para atrair um animal companheiro (lobo, pantera, javali…), que age no seu turno e soma sua proficiência.' },
        { nivel: 5, id: 'besta-coordenado', nome: 'Ataque Coordenado', pagina: 120, resumo: 'Ao usar a ação de Ataque, o companheiro pode atacar corpo a corpo com a reação.' },
        { nivel: 7, id: 'besta-defesa', nome: 'Defesa da Besta', pagina: 120, resumo: 'Se puder ver você, o companheiro tem vantagem em todas as resistências.' },
        { nivel: 11, id: 'besta-tempestade', nome: 'Tempestade de Garras e Presas', pagina: 120, resumo: 'O companheiro pode atacar cada criatura a 1,5 m dele com uma ação.' },
        { nivel: 15, id: 'besta-superior', nome: 'Defesa da Besta Superior', pagina: 120, resumo: 'Reação do companheiro: reduz à metade o dano de um ataque que o atinge.' },
      ],
    },
    {
      id: 'cacador',
      nome: 'Conclave do Caçador',
      pagina: 120,
      resumo: 'Técnicas para derrubar as ameaças mais perigosas.',
      ferramentas: [],
      ataquesPorAcao: (nivel) => (nivel >= 5 ? 2 : 1),
      escolhas: [
        escolha('presa', 3, 'Presa do Caçador', 120, [
          ['Assassino de Colossos', '+1d8 de dano, uma vez por turno, em criatura abaixo do máximo de PV.'],
          ['Matador de Gigantes', 'Reação: ataca uma criatura Grande ou maior a 1,5 m que atacar você.'],
          ['Destruidor de Hordas', 'Uma vez por turno, ataque extra contra outra criatura a 1,5 m do alvo.'],
        ]),
        escolha('taticas', 7, 'Táticas Defensivas', 120, [
          ['Escapar da Horda', 'Ataques de oportunidade contra você têm desvantagem.'],
          ['Defesa Contra Múltiplos Ataques', '+4 na CA contra os próximos ataques de quem já o acertou no turno.'],
          ['Vontade de Aço', 'Vantagem em resistências contra ficar amedrontado.'],
        ]),
        escolha('multiplo', 11, 'Ataque Múltiplo', 121, [
          ['Saraivada', 'Ação: ataque à distância contra todas as criaturas a 3 m de um ponto.'],
          ['Ataque Giratório', 'Ação: ataque corpo a corpo contra cada criatura a 1,5 m.'],
        ]),
        escolha('defesaSuperior', 15, 'Defesa de Caçador Superior', 121, [
          ['Evasão', 'Resistência de Des para meio dano: nenhum dano se passar, metade se falhar.'],
          ['Manter-se Contra a Maré', 'Reação: quando um ataque erra você, faz o atacante repetir contra outra criatura.'],
          ['Esquiva Sobrenatural', 'Reação: reduz à metade o dano de um ataque que você vê.'],
        ]),
      ],
      habilidades: [
        { nivel: 3, id: 'cacador-presa', nome: 'Presa do Caçador', pagina: 120, resumo: 'Técnica de caça escolhida.' },
        { nivel: 5, id: 'cacador-ataque-extra', nome: 'Ataque Extra', pagina: 120, resumo: 'Dois ataques ao usar a ação de Ataque.' },
        { nivel: 7, id: 'cacador-taticas', nome: 'Táticas Defensivas', pagina: 120, resumo: 'Defesa escolhida.' },
        { nivel: 11, id: 'cacador-multiplo', nome: 'Ataque Múltiplo', pagina: 121, resumo: 'Ataque em área escolhido.' },
        { nivel: 15, id: 'cacador-superior', nome: 'Defesa de Caçador Superior', pagina: 121, resumo: 'Defesa avançada escolhida.' },
      ],
    },
    {
      id: 'rastreador',
      nome: 'Conclave do Rastreador Subterrâneo',
      pagina: 121,
      resumo: 'Caçadores das profundezas e da escuridão.',
      ferramentas: [],
      ataquesPorAcao: (nivel) => (nivel >= 5 ? 2 : 1),
      resistenciasExtras: [{ nivel: 7, atributo: 'sab' }],
      extras: ({ nivel }) => [
        {
          nome: 'Magias do rastreador',
          valor: (
            [
              [3, 'disfarçar-se'],
              [5, 'truque de corda'],
              [9, 'glifo de vigilância'],
              [13, 'invisibilidade maior'],
              [17, 'similaridade'],
            ] as const
          )
            .filter(([n]) => n <= nivel)
            .map(([, m]) => m)
            .join(', '),
        },
      ],
      habilidades: [
        { nivel: 3, id: 'rastreador-batedor', nome: 'Batedor do Subterrâneo', pagina: 121, resumo: 'No primeiro turno do combate, +3 m de deslocamento e um ataque a mais. Criaturas com visão no escuro não ganham vantagem para notá-lo no escuro.' },
        { nivel: 3, id: 'rastreador-magias', nome: 'Magia do Rastreador Subterrâneo', pagina: 121, resumo: 'Magias extras sempre conhecidas: disfarçar-se (3º), truque de corda (5º), glifo de vigilância (9º), invisibilidade maior (13º), similaridade (17º).' },
        { nivel: 5, id: 'rastreador-ataque-extra', nome: 'Ataque Extra', pagina: 121, resumo: 'Dois ataques ao usar a ação de Ataque.' },
        { nivel: 7, id: 'rastreador-mente', nome: 'Mente de Aço', pagina: 121, resumo: 'Proficiência em resistências de Sabedoria.' },
        { nivel: 11, id: 'rastreador-rajada', nome: 'Rajada do Rastreador', pagina: 121, resumo: 'Uma vez por turno, ao errar um ataque, pode fazer outro.' },
        { nivel: 15, id: 'rastreador-esquiva', nome: 'Esquiva do Rastreador', pagina: 121, resumo: 'Reação: impõe desvantagem num ataque contra você que não tenha vantagem.' },
      ],
    },
  ],
}
