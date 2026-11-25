import type { Classe } from '../tipos'

/** Ladino (LdJ p. 89–93). Resumos em palavras próprias. */
export const LADINO: Classe = {
  id: 'ladino',
  nome: 'Ladino',
  pagina: 89,
  dadoDeVida: 8,
  resistencias: ['des', 'int'],
  armaduras: ['leve'],
  armas: {
    categorias: ['simples'],
    especificas: ['bestaDeMao', 'espadaLonga', 'rapieira', 'espadaCurta'],
  },
  ferramentas: ['Ferramentas de ladrão'],
  pericias: {
    quantidade: 4,
    opcoes: [
      'acrobacia',
      'atletismo',
      'atuacao',
      'enganacao',
      'furtividade',
      'intimidacao',
      'intuicao',
      'investigacao',
      'percepcao',
      'persuasao',
      'prestidigitacao',
    ],
  },
  equipamentoFixo: [
    { itemId: 'couro', quantidade: 1 },
    { itemId: 'adaga', quantidade: 2 },
    { itemId: 'ferramentasDeLadrao', quantidade: 1 },
  ],
  equipamentoEscolhas: [
    {
      id: 'arma-principal',
      opcoes: [
        { rotulo: 'Rapieira', itens: [{ itemId: 'rapieira', quantidade: 1 }] },
        { rotulo: 'Espada longa', itens: [{ itemId: 'espadaLonga', quantidade: 1 }] },
      ],
    },
    {
      id: 'arma-secundaria',
      opcoes: [
        {
          rotulo: 'Arco curto, aljava e 20 flechas',
          itens: [
            { itemId: 'arcoCurto', quantidade: 1 },
            { itemId: 'aljava', quantidade: 1 },
            { itemId: 'flechas', quantidade: 20 },
          ],
        },
        { rotulo: 'Espada curta', itens: [{ itemId: 'espadaCurta', quantidade: 1 }] },
      ],
    },
    {
      id: 'pacote',
      opcoes: [
        { rotulo: 'Pacote de assaltante', itens: [{ itemId: 'pacoteAssaltante', quantidade: 1 }] },
        { rotulo: 'Pacote de aventureiro', itens: [{ itemId: 'pacoteAventureiro', quantidade: 1 }] },
        { rotulo: 'Pacote de explorador', itens: [{ itemId: 'pacoteExplorador', quantidade: 1 }] },
      ],
    },
  ],
  habilidades: [
    { nivel: 1, id: 'ladino-especializacao', nome: 'Especialização', pagina: 91, resumo: 'Escolha duas perícias proficientes (ou uma e ferramentas de ladrão): o bônus de proficiência dobra nelas. Mais duas no 6º nível.' },
    { nivel: 1, id: 'ladino-ataque-furtivo', nome: 'Ataque Furtivo', pagina: 91, resumo: 'Uma vez por turno, dano extra ao acertar com arma de acuidade ou à distância, se tiver vantagem ou se um aliado não incapacitado estiver a 1,5 m do alvo (e você não tiver desvantagem).' },
    { nivel: 1, id: 'ladino-giria', nome: 'Gíria de Ladrão', pagina: 91, resumo: 'Conhece o código secreto dos ladrões: frases escondidas em conversas comuns e sinais marcados em lugares.' },
    { nivel: 2, id: 'ladino-acao-ardilosa', nome: 'Ação Ardilosa', pagina: 91, resumo: 'Ação bônus em cada turno para Disparada, Desengajar ou Esconder.' },
    { nivel: 3, id: 'ladino-arquetipo', nome: 'Arquétipo de Ladino', pagina: 91, resumo: 'Escolha do arquétipo (Assassino, Ladrão ou Trapaceiro Arcano), que dá habilidades no 3º, 9º, 13º e 17º níveis.' },
    { nivel: 5, id: 'ladino-esquiva', nome: 'Esquiva Sobrenatural', pagina: 91, resumo: 'Reação: quando um inimigo que você vê o acerta, o dano desse ataque cai pela metade.' },
    { nivel: 7, id: 'ladino-evasao', nome: 'Evasão', pagina: 91, resumo: 'Em efeitos com resistência de Destreza para meio dano: sucesso = nenhum dano, falha = metade.' },
    { nivel: 11, id: 'ladino-talento-confiavel', nome: 'Talento Confiável', pagina: 91, resumo: 'Em testes com bônus de proficiência, um resultado de 9 ou menos no d20 conta como 10.' },
    { nivel: 14, id: 'ladino-sentido-cego', nome: 'Sentido Cego', pagina: 91, resumo: 'Se puder ouvir, sabe onde estão criaturas escondidas ou invisíveis a até 3 m.' },
    { nivel: 15, id: 'ladino-mente-escorregadia', nome: 'Mente Escorregadia', pagina: 91, resumo: 'Proficiência em testes de resistência de Sabedoria.' },
    { nivel: 18, id: 'ladino-elusivo', nome: 'Elusivo', pagina: 91, resumo: 'Enquanto não estiver incapacitado, nenhum ataque contra você tem vantagem.' },
    { nivel: 20, id: 'ladino-golpe-de-sorte', nome: 'Golpe de Sorte', pagina: 92, resumo: 'Transforma um ataque errado em acerto, ou um teste falho em 20 natural. Recarrega em descanso curto ou longo.' },
  ],
  niveisIncremento: [4, 8, 10, 12, 16, 19],
  nivelSubclasse: 3,
  nomeSubclasse: 'Arquétipo de Ladino',
  especializacao: [
    { nivel: 1, quantidade: 2 },
    { nivel: 6, quantidade: 2 },
  ],
  resistenciasPorNivel: [{ nivel: 15, atributo: 'sab' }],
  subclasses: [
    {
      id: 'assassino',
      nome: 'Assassino',
      pagina: 92,
      resumo: 'Especialista em emboscadas, disfarces e venenos.',
      ferramentas: ['Kit de disfarce', 'Kit de venenos'],
      habilidades: [
        { nivel: 3, id: 'assassino-proficiencia', nome: 'Proficiência Adicional', pagina: 92, resumo: 'Proficiência com kit de disfarce e kit de venenos.' },
        { nivel: 3, id: 'assassino-assassinar', nome: 'Assassinar', pagina: 92, resumo: 'Vantagem em ataques contra criaturas que ainda não agiram no combate. Todo acerto contra uma criatura surpresa é crítico.' },
        { nivel: 9, id: 'assassino-infiltracao', nome: 'Especialização em Infiltração', pagina: 92, resumo: 'Com 7 dias e 25 po, cria uma identidade falsa completa (histórico, profissão, contatos).' },
        { nivel: 13, id: 'assassino-impostor', nome: 'Impostor', pagina: 92, resumo: 'Depois de estudar alguém por 3 horas, imita sua fala, escrita e jeito. Vantagem em Enganação para não ser descoberto.' },
        { nivel: 17, id: 'assassino-golpe-letal', nome: 'Golpe Letal', pagina: 92, resumo: 'Ao acertar uma criatura surpresa, ela faz resistência de Constituição (CD 8 + mod. Des + proficiência); se falhar, o dano do ataque dobra.' },
      ],
    },
  ],
}

/** Dados de Ataque Furtivo por nível de ladino: 1d6 no 1º, +1d6 a cada nível ímpar. */
export function dadosAtaqueFurtivo(nivel: number): number {
  return Math.ceil(nivel / 2)
}
