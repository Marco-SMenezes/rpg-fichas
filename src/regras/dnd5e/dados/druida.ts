import type { Classe } from '../tipos'
import { magias as m } from './nomesDeMagias'

/** ND máximo da Forma Selvagem (LdJ p. 73). */
export function ndFormaSelvagem(nivel: number, circuloDaLua: boolean): string {
  if (circuloDaLua) return nivel >= 6 ? String(Math.floor(nivel / 3)) : '1'
  return nivel >= 8 ? '1' : nivel >= 4 ? '1/2' : '1/4'
}

const terreno = (...pares: [string, string][]) =>
  Object.fromEntries(pares.map(([a, b], i) => [[3, 5, 7, 9][i]!, m(a, b)]))

const TERRENOS: Record<string, Record<number, string[]>> = {
  Ártico: terreno(['imobilizar pessoa', 'crescer espinhos'], ['nevasca', 'lentidão'], ['movimentação livre', 'tempestade de gelo'], ['comunhão com a natureza', 'cone de frio']),
  Costa: terreno(['passo nebuloso', 'reflexos'], ['andar na água', 'respirar na água'], ['movimentação livre', 'controlar a água'], ['vidência', 'conjurar elemental']),
  Deserto: terreno(['nublar', 'silêncio'], ['criar alimentos', 'proteção contra energia'], ['malogro', 'terreno alucinógeno'], ['muralha de pedra', 'praga de insetos']),
  Floresta: terreno(['patas de aranha', 'pele de árvore'], ['convocar relâmpagos', 'ampliar plantas'], ['adivinhação', 'movimentação livre'], ['comunhão com a natureza', 'caminhar em árvores']),
  Montanha: terreno(['crescer espinhos', 'patas de aranha'], ['mesclar-se às rochas', 'relâmpago'], ['moldar rochas', 'pele de pedra'], ['criar passagem', 'muralha de pedra']),
  Pântano: terreno(['escuridão', 'flecha ácida de Melf'], ['andar na água', 'névoa fétida'], ['localizar criatura', 'movimentação livre'], ['vidência', 'praga de insetos']),
  Planície: terreno(['invisibilidade', 'passos sem pegadas'], ['luz do dia', 'velocidade'], ['adivinhação', 'movimentação livre'], ['praga de insetos', 'sonho']),
  Subterrâneo: terreno(['patas de aranha', 'teia'], ['forma gasosa', 'névoa fétida'], ['invisibilidade maior', 'moldar rochas'], ['praga de insetos', 'névoa mortal']),
}

/** Druida (LdJ p. 71–76). Resumos em palavras próprias. */
export const DRUIDA: Classe = {
  id: 'druida',
  nome: 'Druida',
  pagina: 71,
  dadoDeVida: 8,
  resistencias: ['int', 'sab'],
  armaduras: ['leve', 'media', 'escudo'],
  armas: {
    categorias: [],
    especificas: ['porrete', 'adaga', 'dardo', 'azagaia', 'maca', 'bordao', 'cimitarra', 'foiceCurta', 'funda', 'lanca'],
  },
  ferramentas: ['Kit de herbalismo'],
  pericias: {
    quantidade: 2,
    opcoes: ['arcanismo', 'adestrarAnimais', 'intuicao', 'medicina', 'natureza', 'percepcao', 'religiao', 'sobrevivencia'],
  },
  equipamentoFixo: [
    { itemId: 'couro', quantidade: 1 },
    { itemId: 'pacoteExplorador', quantidade: 1 },
    { itemId: 'focoDruidico', quantidade: 1 },
  ],
  equipamentoEscolhas: [
    {
      id: 'defesa',
      opcoes: [
        { rotulo: 'Escudo de madeira', itens: [{ itemId: 'escudo', quantidade: 1 }] },
        { rotulo: 'Qualquer arma simples', itens: [{ itemId: 'qualquer:simples', quantidade: 1 }] },
      ],
    },
    {
      id: 'arma',
      opcoes: [
        { rotulo: 'Cimitarra', itens: [{ itemId: 'cimitarra', quantidade: 1 }] },
        { rotulo: 'Qualquer arma simples corpo a corpo', itens: [{ itemId: 'qualquer:simples-corpo', quantidade: 1 }] },
      ],
    },
  ],
  habilidades: [
    { nivel: 1, id: 'druida-druidico', nome: 'Druídico', pagina: 73, resumo: 'Conhece o idioma secreto dos druidas e deixa mensagens ocultas.' },
    { nivel: 1, id: 'druida-conjuracao', nome: 'Conjuração', pagina: 73, resumo: 'Prepara magias de druida (Sabedoria + nível) após descanso longo; conjura rituais preparados. Não usa armadura nem escudo de metal.' },
    { nivel: 2, id: 'druida-forma', nome: 'Forma Selvagem', pagina: 73, resumo: 'Ação: vira uma besta já vista, de ND limitado (1/4, 1/2 no 4º, 1 no 8º), por metade do nível em horas. Sem voo antes do 8º e sem nado antes do 4º. Dois usos por descanso curto.' },
    { nivel: 2, id: 'druida-circulo', nome: 'Círculo Druídico', pagina: 74, resumo: 'Escolha do círculo (Terra ou Lua), com habilidades no 2º, 6º, 10º e 14º níveis.' },
    { nivel: 18, id: 'druida-atemporal', nome: 'Corpo Atemporal', pagina: 74, resumo: 'Envelhece um ano a cada dez.' },
    { nivel: 18, id: 'druida-besta', nome: 'Magias da Besta', pagina: 74, resumo: 'Conjura magias na Forma Selvagem com componentes verbais e somáticos.' },
    { nivel: 20, id: 'druida-arquidruida', nome: 'Arquidruida', pagina: 74, resumo: 'Forma Selvagem ilimitada e ignora componentes sem custo das magias de druida.' },
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 2,
  nomeSubclasse: 'Círculo Druídico',
  conjuracao: { tipo: 'completo', atributo: 'sab' },
  magias: {
    truques: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    preparadas: ({ nivel, mod }) => Math.max(1, mod.sab + nivel),
  },
  recursos: ({ nivel }) =>
    nivel >= 2
      ? [{ id: 'forma-selvagem', nome: 'Forma Selvagem', maximo: nivel >= 20 ? null : 2, recarga: 'curto', detalhe: `até ${Math.floor(nivel / 2)} h`, pagina: 73 }]
      : [],
  extras: ({ nivel }) => (nivel >= 2 ? [{ nome: 'ND máximo da Forma Selvagem', valor: ndFormaSelvagem(nivel, false) }] : []),
  subclasses: [
    {
      id: 'terra',
      nome: 'Círculo da Terra',
      pagina: 75,
      resumo: 'Guardiões do conhecimento antigo, ligados a um tipo de terreno.',
      ferramentas: [],
      escolhas: [
        {
          id: 'terreno',
          nivel: 2,
          rotulo: 'Terreno do círculo',
          pagina: 75,
          opcoes: Object.keys(TERRENOS).map((t) => ({ id: t, nome: t, resumo: 'Define as magias de círculo do 3º, 5º, 7º e 9º níveis.' })),
        },
      ],
      magiasPorEscolha: { escolha: 'terreno', porOpcao: TERRENOS },
      recursos: ({ nivel }) => [
        { id: 'recuperacao-natural', nome: 'Recuperação Natural', maximo: 1, recarga: 'longo', detalhe: `espaços somando até ${Math.ceil(nivel / 2)} níveis`, pagina: 75 },
      ],
      habilidades: [
        { nivel: 2, id: 'terra-truque', nome: 'Truque Adicional', pagina: 75, resumo: 'Um truque de druida a mais.' },
        { nivel: 2, id: 'terra-recuperacao', nome: 'Recuperação Natural', pagina: 75, resumo: 'Num descanso curto, recupera espaços que somem até metade do nível (para cima), nenhum de 6º ou mais. Uma vez por descanso longo.' },
        { nivel: 3, id: 'terra-magias', nome: 'Magias de Círculo', pagina: 75, resumo: 'Magias do terreno escolhido sempre preparadas.' },
        { nivel: 6, id: 'terra-caminho', nome: 'Caminho da Floresta', pagina: 76, resumo: 'Terreno difícil não mágico não gasta movimento extra; plantas mágicas não o atrapalham.' },
        { nivel: 10, id: 'terra-protecao', nome: 'Proteção Natural', pagina: 76, resumo: 'Imune a veneno e doença; elementais e fadas não o enfeitiçam nem amedrontam.' },
        { nivel: 14, id: 'terra-santuario', nome: 'Santuário Natural', pagina: 76, resumo: 'Bestas e plantas precisam passar numa resistência de Sab para atacá-lo.' },
      ],
    },
    {
      id: 'lua',
      nome: 'Círculo da Lua',
      pagina: 76,
      resumo: 'Mestres da Forma Selvagem.',
      ferramentas: [],
      extras: ({ nivel }) => [{ nome: 'ND máximo da Forma Selvagem (Lua)', valor: ndFormaSelvagem(nivel, true) }],
      habilidades: [
        { nivel: 2, id: 'lua-combate', nome: 'Forma Selvagem de Combate', pagina: 76, resumo: 'Forma Selvagem como ação bônus; na forma, gasta espaços para curar 1d8 por nível do espaço.' },
        { nivel: 2, id: 'lua-formas', nome: 'Formas de Círculo', pagina: 76, resumo: 'Bestas de ND 1; a partir do 6º, ND igual a um terço do nível.' },
        { nivel: 6, id: 'lua-primordial', nome: 'Ataque Primordial', pagina: 76, resumo: 'Ataques na forma de besta contam como mágicos.' },
        { nivel: 10, id: 'lua-elemental', nome: 'Forma Selvagem de Elemental', pagina: 76, resumo: 'Gasta dois usos para virar um elemental do ar, terra, fogo ou água.' },
        { nivel: 14, id: 'lua-mil-formas', nome: 'Mil Formas', pagina: 76, resumo: 'Conjura alterar-se à vontade.' },
      ],
    },
  ],
}
