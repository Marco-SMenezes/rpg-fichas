import type { Classe, EscolhaDeClasse, EstiloDeLuta } from '../tipos'

const ESTILOS: Record<EstiloDeLuta, { nome: string; resumo: string }> = {
  arquearia: { nome: 'Arquearia', resumo: '+2 nas jogadas de ataque com armas à distância.' },
  defesa: { nome: 'Defesa', resumo: '+1 na CA enquanto usa armadura.' },
  duelismo: { nome: 'Duelismo', resumo: '+2 no dano com arma corpo a corpo numa mão e nenhuma outra arma.' },
  armasGrandes: { nome: 'Combate com Armas Grandes', resumo: 'Rola de novo 1 e 2 nos dados de dano de armas de duas mãos ou versáteis usadas com as duas mãos.' },
  protecao: { nome: 'Proteção', resumo: 'Com escudo, usa a reação para dar desvantagem num ataque contra aliado a 1,5 m.' },
  duasArmas: { nome: 'Combate com Duas Armas', resumo: 'Soma o modificador de atributo no dano do segundo ataque.' },
}

/** Escolha de estilo de luta (LdJ p. 85) com as opções que a classe permite. */
export function escolhaDeEstilo(id: string, nivel: number, pagina: number, estilos: EstiloDeLuta[], rotulo = 'Estilo de Luta'): EscolhaDeClasse {
  return { id, nivel, rotulo, pagina, opcoes: estilos.map((e) => ({ id: e, ...ESTILOS[e] })) }
}

const TODOS: EstiloDeLuta[] = ['arquearia', 'defesa', 'duelismo', 'armasGrandes', 'protecao', 'duasArmas']

export function dadosDeSuperioridade(nivel: number): { quantidade: number; dado: string } {
  return {
    quantidade: nivel >= 15 ? 6 : nivel >= 7 ? 5 : 4,
    dado: nivel >= 18 ? 'd12' : nivel >= 10 ? 'd10' : 'd8',
  }
}

export function manobrasConhecidas(nivel: number): number {
  return nivel >= 15 ? 9 : nivel >= 10 ? 7 : nivel >= 7 ? 5 : 3
}

/** Guerreiro (LdJ p. 83–88). Resumos em palavras próprias. */
export const GUERREIRO: Classe = {
  id: 'guerreiro',
  nome: 'Guerreiro',
  pagina: 83,
  dadoDeVida: 10,
  resistencias: ['for', 'con'],
  armaduras: ['leve', 'media', 'pesada', 'escudo'],
  armas: { categorias: ['simples', 'marcial'], especificas: [] },
  ferramentas: [],
  pericias: {
    quantidade: 2,
    opcoes: ['acrobacia', 'adestrarAnimais', 'atletismo', 'historia', 'intuicao', 'intimidacao', 'percepcao', 'sobrevivencia'],
  },
  equipamentoFixo: [],
  equipamentoEscolhas: [
    {
      id: 'armadura',
      opcoes: [
        { rotulo: 'Cota de malha', itens: [{ itemId: 'cotaDeMalha', quantidade: 1 }] },
        {
          rotulo: 'Gibão de peles, arco longo e 20 flechas',
          itens: [
            { itemId: 'gibaoDePeles', quantidade: 1 },
            { itemId: 'arcoLongo', quantidade: 1 },
            { itemId: 'aljava', quantidade: 1 },
            { itemId: 'flechas', quantidade: 20 },
          ],
        },
      ],
    },
    {
      id: 'arma-principal',
      opcoes: [
        { rotulo: 'Uma arma marcial e um escudo', itens: [{ itemId: 'qualquer:marcial', quantidade: 1 }, { itemId: 'escudo', quantidade: 1 }] },
        { rotulo: 'Duas armas marciais (iguais)', itens: [{ itemId: 'qualquer:marcial', quantidade: 2 }] },
      ],
    },
    {
      id: 'arma-distancia',
      opcoes: [
        { rotulo: 'Besta leve e 20 virotes', itens: [{ itemId: 'bestaLeve', quantidade: 1 }, { itemId: 'virotes', quantidade: 20 }] },
        { rotulo: 'Duas machadinhas', itens: [{ itemId: 'machadinha', quantidade: 2 }] },
      ],
    },
    {
      id: 'pacote',
      opcoes: [
        { rotulo: 'Pacote de aventureiro', itens: [{ itemId: 'pacoteAventureiro', quantidade: 1 }] },
        { rotulo: 'Pacote de explorador', itens: [{ itemId: 'pacoteExplorador', quantidade: 1 }] },
      ],
    },
  ],
  habilidades: [
    { nivel: 1, id: 'guerreiro-estilo', nome: 'Estilo de Luta', pagina: 85, resumo: 'Especialidade de combate escolhida entre seis estilos.' },
    { nivel: 1, id: 'guerreiro-folego', nome: 'Retomar o Fôlego', pagina: 85, resumo: 'Ação bônus: recupera 1d10 + nível de guerreiro em PV. Recarrega em descanso curto ou longo.' },
    { nivel: 2, id: 'guerreiro-surto', nome: 'Surto de Ação', pagina: 85, resumo: 'Uma ação extra no turno. Recarrega em descanso curto ou longo; dois usos a partir do 17º nível (um por turno).' },
    { nivel: 3, id: 'guerreiro-arquetipo', nome: 'Arquétipo Marcial', pagina: 85, resumo: 'Escolha do arquétipo (Campeão, Mestre de Batalha ou Cavaleiro Arcano), com habilidades no 3º, 7º, 10º, 15º e 18º níveis.' },
    { nivel: 5, id: 'guerreiro-ataque-extra', nome: 'Ataque Extra', pagina: 85, resumo: 'Dois ataques por ação de Ataque; três no 11º e quatro no 20º nível.' },
    { nivel: 9, id: 'guerreiro-indomavel', nome: 'Indomável', pagina: 85, resumo: 'Rola de novo uma resistência que falhou. Um uso por descanso longo; dois no 13º e três no 17º.' },
  ],
  niveisIncremento: [4, 6, 8, 12, 14, 16, 19],
  nivelSubclasse: 3,
  nomeSubclasse: 'Arquétipo Marcial',
  escolhas: [escolhaDeEstilo('estiloDeLuta', 1, 85, TODOS)],
  ataquesPorAcao: (nivel) => (nivel >= 20 ? 4 : nivel >= 11 ? 3 : nivel >= 5 ? 2 : 1),
  recursos: ({ nivel }) => [
    { id: 'folego', nome: 'Retomar o Fôlego', maximo: 1, recarga: 'curto', detalhe: `1d10+${nivel} PV`, pagina: 85 },
    ...(nivel >= 2
      ? [{ id: 'surto', nome: 'Surto de Ação', maximo: nivel >= 17 ? 2 : 1, recarga: 'curto' as const, detalhe: 'uma ação extra', pagina: 85 }]
      : []),
    ...(nivel >= 9
      ? [{ id: 'indomavel', nome: 'Indomável', maximo: nivel >= 17 ? 3 : nivel >= 13 ? 2 : 1, recarga: 'longo' as const, detalhe: 'rolar resistência de novo', pagina: 85 }]
      : []),
  ],
  subclasses: [
    {
      id: 'campeao',
      nome: 'Campeão',
      pagina: 85,
      resumo: 'Excelência física pura: críticos mais frequentes e resistência.',
      ferramentas: [],
      margemCritico: (nivel) => (nivel >= 15 ? 18 : 19),
      escolhas: [escolhaDeEstilo('estiloDeLuta2', 10, 86, TODOS, 'Estilo de Luta Adicional (diferente do primeiro)')],
      habilidades: [
        { nivel: 3, id: 'campeao-critico', nome: 'Crítico Aprimorado', pagina: 85, resumo: 'Ataques com arma são críticos com 19 ou 20 no d20.' },
        { nivel: 7, id: 'campeao-atleta', nome: 'Atleta Notável', pagina: 86, resumo: 'Metade da proficiência (arredondada para cima) em testes de For, Des e Con sem proficiência; salto com corrida mais longo.' },
        { nivel: 10, id: 'campeao-estilo', nome: 'Estilo de Luta Adicional', pagina: 86, resumo: 'Um segundo estilo de luta.' },
        { nivel: 15, id: 'campeao-superior', nome: 'Crítico Superior', pagina: 86, resumo: 'Críticos com 18, 19 ou 20.' },
        { nivel: 18, id: 'campeao-sobrevivente', nome: 'Sobrevivente', pagina: 86, resumo: 'Com até metade dos PV (e mais de 0), recupera 5 + Con PV no início de cada turno.' },
      ],
    },
    {
      id: 'mestre-de-batalha',
      nome: 'Mestre de Batalha',
      pagina: 87,
      resumo: 'Tática e técnica: manobras alimentadas por dados de superioridade.',
      ferramentas: [],
      recursos: ({ nivel }) => {
        const d = dadosDeSuperioridade(nivel)
        return [{ id: 'superioridade', nome: 'Dados de superioridade', maximo: d.quantidade, recarga: 'curto', detalhe: d.dado, pagina: 87 }]
      },
      extras: ({ nivel, proficiencia, mod }) => [
        { nome: 'CD das manobras', valor: String(8 + proficiencia + Math.max(mod.for, mod.des)) },
        { nome: 'Manobras conhecidas', valor: String(manobrasConhecidas(nivel)) },
      ],
      habilidades: [
        { nivel: 3, id: 'mb-superioridade', nome: 'Superioridade em Combate', pagina: 87, resumo: 'Aprende três manobras e tem quatro dados de superioridade (d8). Mais manobras no 7º, 10º e 15º; mais dados no 7º e 15º.' },
        { nivel: 3, id: 'mb-estudioso', nome: 'Estudioso da Guerra', pagina: 87, resumo: 'Proficiência com um tipo de ferramenta de artesão à escolha.' },
        { nivel: 7, id: 'mb-inimigo', nome: 'Conheça seu Inimigo', pagina: 88, resumo: 'Observando uma criatura por 1 minuto, descobre se ela é melhor, pior ou igual a você em duas características.' },
        { nivel: 10, id: 'mb-aprimorada', nome: 'Superioridade em Combate Aprimorada', pagina: 88, resumo: 'Os dados viram d10 (d12 no 18º nível).' },
        { nivel: 15, id: 'mb-implacavel', nome: 'Implacável', pagina: 88, resumo: 'Ao rolar iniciativa sem dados de superioridade, recupera um.' },
      ],
    },
    {
      id: 'cavaleiro-arcano',
      nome: 'Cavaleiro Arcano',
      pagina: 86,
      resumo: 'Combina luta com magias de abjuração e evocação do mago.',
      ferramentas: [],
      conjuracao: { tipo: 'terco', atributo: 'int' },
      habilidades: [
        { nivel: 3, id: 'ca-conjuracao', nome: 'Conjuração', pagina: 86, resumo: 'Magias de mago (sobretudo abjuração e evocação) com Inteligência, como um terço de conjurador.' },
        { nivel: 3, id: 'ca-vinculo', nome: 'Vínculo com Arma', pagina: 86, resumo: 'Ritual de 1 hora vincula até duas armas: não pode ser desarmado e as invoca para a mão com uma ação bônus.' },
        { nivel: 7, id: 'ca-magia-guerra', nome: 'Magia de Guerra', pagina: 86, resumo: 'Ao usar a ação para um truque, pode atacar com arma como ação bônus.' },
        { nivel: 10, id: 'ca-golpe', nome: 'Golpe Místico', pagina: 87, resumo: 'Ao acertar com arma, o alvo tem desvantagem na próxima resistência contra sua magia até o fim do seu próximo turno.' },
        { nivel: 15, id: 'ca-investida', nome: 'Investida Arcana', pagina: 87, resumo: 'Ao usar Surto de Ação, pode se teletransportar até 9 m.' },
        { nivel: 18, id: 'ca-magia-aprimorada', nome: 'Magia de Guerra Aprimorada', pagina: 87, resumo: 'Ao usar a ação para uma magia, pode atacar com arma como ação bônus.' },
      ],
    },
  ],
}
