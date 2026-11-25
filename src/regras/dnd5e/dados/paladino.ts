import type { Classe, Subclasse } from '../tipos'
import { escolhaDeEstilo } from './guerreiro'
import { magias as m } from './nomesDeMagias'

/** Magias de juramento sempre preparadas, por nível de paladino (LdJ p. 112–114). */
export type MagiasDeJuramento = Record<number, string[]>

const juramento = ({ magiasDeJuramento, ...sub }: Omit<Subclasse, 'ferramentas'> & { magiasDeJuramento: MagiasDeJuramento }): Subclasse => ({
  ferramentas: [],
  ...sub,
  magiasSempre: Object.fromEntries(Object.entries(magiasDeJuramento).map(([n, nomes]) => [n, m(...nomes)])),
})

/** Paladino (LdJ p. 108–114). Resumos em palavras próprias. */
export const PALADINO: Classe = {
  id: 'paladino',
  nome: 'Paladino',
  pagina: 108,
  dadoDeVida: 10,
  resistencias: ['sab', 'car'],
  armaduras: ['leve', 'media', 'pesada', 'escudo'],
  armas: { categorias: ['simples', 'marcial'], especificas: [] },
  ferramentas: [],
  pericias: { quantidade: 2, opcoes: ['atletismo', 'intuicao', 'intimidacao', 'medicina', 'persuasao', 'religiao'] },
  equipamentoFixo: [
    { itemId: 'cotaDeMalha', quantidade: 1 },
    { itemId: 'simboloSagrado', quantidade: 1 },
  ],
  equipamentoEscolhas: [
    {
      id: 'arma-principal',
      opcoes: [
        { rotulo: 'Uma arma marcial e um escudo', itens: [{ itemId: 'qualquer:marcial', quantidade: 1 }, { itemId: 'escudo', quantidade: 1 }] },
        { rotulo: 'Duas armas marciais (iguais)', itens: [{ itemId: 'qualquer:marcial', quantidade: 2 }] },
      ],
    },
    {
      id: 'arma-secundaria',
      opcoes: [
        { rotulo: 'Cinco azagaias', itens: [{ itemId: 'azagaia', quantidade: 5 }] },
        { rotulo: 'Qualquer arma simples corpo a corpo', itens: [{ itemId: 'qualquer:simples-corpo', quantidade: 1 }] },
      ],
    },
    {
      id: 'pacote',
      opcoes: [
        { rotulo: 'Pacote de sacerdote', itens: [{ itemId: 'pacoteSacerdote', quantidade: 1 }] },
        { rotulo: 'Pacote de aventureiro', itens: [{ itemId: 'pacoteAventureiro', quantidade: 1 }] },
      ],
    },
  ],
  habilidades: [
    { nivel: 1, id: 'paladino-sentido', nome: 'Sentido Divino', pagina: 110, resumo: 'Ação: até o fim do próximo turno, sabe onde há celestiais, corruptores e mortos-vivos a até 18 m, e lugares consagrados ou profanados. 1 + Car usos por descanso longo.' },
    { nivel: 1, id: 'paladino-maos', nome: 'Cura pelas Mãos', pagina: 110, resumo: 'Reserva de 5 × nível de PV para curar com um toque; 5 pontos curam uma doença ou neutralizam um veneno. Recarrega em descanso longo.' },
    { nivel: 2, id: 'paladino-estilo', nome: 'Estilo de Luta', pagina: 110, resumo: 'Especialidade de combate: Defesa, Duelismo, Combate com Armas Grandes ou Proteção.' },
    { nivel: 2, id: 'paladino-conjuracao', nome: 'Conjuração', pagina: 110, resumo: 'Prepara magias de paladino (Carisma + metade do nível) após descanso longo. CD = 8 + prof. + Car.' },
    { nivel: 2, id: 'paladino-destruicao', nome: 'Destruição Divina', pagina: 111, resumo: 'Ao acertar corpo a corpo, gaste um espaço de magia: +2d8 radiante (+1d8 por nível acima do 1º, máximo 5d8), +1d8 contra mortos-vivos e corruptores.' },
    { nivel: 3, id: 'paladino-saude', nome: 'Saúde Divina', pagina: 111, resumo: 'Imune a doenças.' },
    { nivel: 3, id: 'paladino-juramento', nome: 'Juramento Sagrado', pagina: 111, resumo: 'Escolha do juramento (Devoção, Anciões ou Vingança), com magias de juramento e habilidades no 3º, 7º, 15º e 20º níveis.' },
    { nivel: 3, id: 'paladino-canalizar', nome: 'Canalizar Divindade', pagina: 111, resumo: 'Opções do juramento; um uso por descanso curto ou longo.' },
    { nivel: 5, id: 'paladino-ataque-extra', nome: 'Ataque Extra', pagina: 111, resumo: 'Dois ataques ao usar a ação de Ataque.' },
    { nivel: 6, id: 'paladino-aura-protecao', nome: 'Aura de Proteção', pagina: 111, resumo: 'Você e aliados a 3 m somam seu modificador de Carisma (mínimo +1) nas resistências, se você estiver consciente. Raio de 9 m no 18º nível.' },
    { nivel: 10, id: 'paladino-aura-coragem', nome: 'Aura de Coragem', pagina: 111, resumo: 'Você e aliados a 3 m não podem ficar amedrontados enquanto você estiver consciente. Raio de 9 m no 18º nível.' },
    { nivel: 11, id: 'paladino-destruicao-aprimorada', nome: 'Destruição Divina Aprimorada', pagina: 111, resumo: 'Todo acerto corpo a corpo com arma causa +1d8 radiante.' },
    { nivel: 14, id: 'paladino-toque', nome: 'Toque Purificador', pagina: 111, resumo: 'Ação: encerra uma magia em você ou numa criatura voluntária que tocar. Usos iguais ao mod. de Carisma (mínimo 1) por descanso longo.' },
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 3,
  nomeSubclasse: 'Juramento Sagrado',
  conjuracao: { tipo: 'meio', atributo: 'car' },
  magias: { preparadas: ({ nivel, mod }) => (nivel >= 2 ? Math.max(1, mod.car + Math.floor(nivel / 2)) : 0) },
  escolhas: [escolhaDeEstilo('estiloDeLuta', 2, 110, ['defesa', 'duelismo', 'armasGrandes', 'protecao'])],
  ataquesPorAcao: (nivel) => (nivel >= 5 ? 2 : 1),
  bonusResistencias: ({ nivel, mod }) => (nivel >= 6 ? Math.max(1, mod.car) : 0),
  recursos: ({ nivel, mod }) => [
    { id: 'sentido-divino', nome: 'Sentido Divino', maximo: Math.max(1, 1 + mod.car), recarga: 'longo', detalhe: '18 m até o próximo turno', pagina: 110 },
    { id: 'cura-pelas-maos', nome: 'Cura pelas Mãos (PV)', maximo: 5 * nivel, recarga: 'longo', detalhe: '5 pontos curam doença ou veneno', pagina: 110 },
    ...(nivel >= 3 ? [{ id: 'canalizar', nome: 'Canalizar Divindade', maximo: 1, recarga: 'curto' as const, detalhe: 'opção do juramento', pagina: 111 }] : []),
    ...(nivel >= 14 ? [{ id: 'toque-purificador', nome: 'Toque Purificador', maximo: Math.max(1, mod.car), recarga: 'longo' as const, detalhe: 'encerra uma magia', pagina: 111 }] : []),
  ],
  extras: ({ nivel, mod }) => (nivel >= 6 ? [{ nome: 'Aura de Proteção', valor: `+${Math.max(1, mod.car)} nas resistências (${nivel >= 18 ? 9 : 3} m)` }] : []),
  subclasses: [
    juramento({
      id: 'devocao',
      nome: 'Juramento de Devoção',
      pagina: 112,
      resumo: 'O ideal do cavaleiro sagrado: honestidade, coragem, compaixão e dever.',
      magiasDeJuramento: {
        3: ['proteção contra o bem e mal', 'santuário'],
        5: ['restauração menor', 'zona da verdade'],
        9: ['sinal de esperança', 'dissipar magia'],
        13: ['movimentação livre', 'guardião da fé'],
        17: ['comunhão', 'coluna de chamas'],
      },
      habilidades: [
        { nivel: 3, id: 'devocao-canalizar', nome: 'Canalizar Divindade', pagina: 112, resumo: 'Arma Sagrada: por 1 minuto, a arma soma Carisma no ataque e emite luz. Expulsar o Profano: corruptores e mortos-vivos a 9 m fazem resistência de Sab ou ficam expulsos.' },
        { nivel: 7, id: 'devocao-aura', nome: 'Aura de Devoção', pagina: 112, resumo: 'Você e aliados a 3 m não podem ser enfeitiçados enquanto você estiver consciente (9 m no 18º).' },
        { nivel: 15, id: 'devocao-pureza', nome: 'Pureza de Espírito', pagina: 112, resumo: 'Sempre sob o efeito de proteção contra o bem e mal.' },
        { nivel: 20, id: 'devocao-halo', nome: 'Halo Sagrado', pagina: 112, resumo: 'Por 1 minuto, aura de luz que causa 10 radiante a inimigos que começam o turno nela e dá vantagem em resistências contra corruptores e mortos-vivos. Uma vez por descanso longo.' },
      ],
    }),
    juramento({
      id: 'ancioes',
      nome: 'Juramento dos Anciões',
      pagina: 112,
      resumo: 'Defender a luz, a vida e a alegria do mundo contra as trevas.',
      magiasDeJuramento: {
        3: ['golpe constritor', 'falar com animais'],
        5: ['raio lunar', 'passo nebuloso'],
        9: ['ampliar plantas', 'proteção contra energia'],
        13: ['tempestade de gelo', 'pele de pedra'],
        17: ['comunhão com a natureza', 'caminhar em árvores'],
      },
      habilidades: [
        { nivel: 3, id: 'ancioes-canalizar', nome: 'Canalizar Divindade', pagina: 113, resumo: 'Ira da Natureza: vinhas impedem uma criatura a 3 m (resistência de For ou Des). Expulsar os Infiéis: fadas e corruptores a 9 m fazem resistência de Sab ou ficam expulsos.' },
        { nivel: 7, id: 'ancioes-aura', nome: 'Aura de Vigilância', pagina: 113, resumo: 'Você e aliados a 3 m têm resistência a dano de magias (9 m no 18º).' },
        { nivel: 15, id: 'ancioes-sentinela', nome: 'Sentinela Imortal', pagina: 113, resumo: 'Ao cair a 0 PV sem morrer, fica com 1 PV, uma vez por descanso longo. Não sofre a velhice.' },
        { nivel: 20, id: 'ancioes-campeao', nome: 'Campeão dos Anciões', pagina: 113, resumo: 'Por 1 minuto: recupera 10 PV por turno, conjura magias de paladino como ação bônus e inimigos a 3 m têm desvantagem contra suas magias. Uma vez por descanso longo.' },
      ],
    }),
    juramento({
      id: 'vinganca',
      nome: 'Juramento de Vingança',
      pagina: 114,
      resumo: 'Punir quem comete pecados graves, a qualquer custo.',
      magiasDeJuramento: {
        3: ['perdição', 'marca do caçador'],
        5: ['imobilizar pessoa', 'passo nebuloso'],
        9: ['velocidade', 'proteção contra energia'],
        13: ['banimento', 'porta dimensional'],
        17: ['imobilizar monstro', 'vidência'],
      },
      habilidades: [
        { nivel: 3, id: 'vinganca-canalizar', nome: 'Canalizar Divindade', pagina: 114, resumo: 'Abjurar Inimigo: uma criatura a 18 m faz resistência de Sab ou fica amedrontada e com deslocamento 0. Voto de Inimizade: vantagem nos ataques contra uma criatura a 3 m por 1 minuto.' },
        { nivel: 7, id: 'vinganca-incansavel', nome: 'Vingador Implacável', pagina: 114, resumo: 'Ao acertar um ataque de oportunidade, pode se mover metade do deslocamento sem provocar ataques.' },
        { nivel: 15, id: 'vinganca-alma', nome: 'Alma de Vingança', pagina: 114, resumo: 'Reação: ataca corpo a corpo a criatura do seu Voto de Inimizade quando ela atacar.' },
        { nivel: 20, id: 'vinganca-anjo', nome: 'Anjo Vingador', pagina: 114, resumo: 'Por 1 hora: asas com voo de 18 m e aura de 9 m que amedronta inimigos (resistência de Sab). Uma vez por descanso longo.' },
      ],
    }),
  ],
}
