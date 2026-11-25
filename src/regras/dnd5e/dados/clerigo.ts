import type { Classe, PericiaId, Subclasse } from '../tipos'
import { NOME_PERICIA } from './atributos'
import { escolhasEmSerie, valoresDaSerie } from './escolhas'
import { MAGIAS } from './magias'
import { IDIOMAS } from './racas'

const TRUQUES_DE_DRUIDA = MAGIAS.filter((x) => x.nivel === 0 && x.classes.includes('druida'))
import { magias as m } from './nomesDeMagias'

/** ND máximo destruído por Destruir Mortos-Vivos (LdJ p. 66). */
export function ndDestruirMortosVivos(nivel: number): string | null {
  if (nivel >= 17) return '4'
  if (nivel >= 14) return '3'
  if (nivel >= 11) return '2'
  if (nivel >= 8) return '1'
  if (nivel >= 5) return '1/2'
  return null
}

const dominio = (
  sub: Omit<Subclasse, 'ferramentas' | 'magiasSempre'> & { magiasDeDominio: [string, string][] },
): Subclasse => {
  const { magiasDeDominio, ...resto } = sub
  return {
    ferramentas: [],
    ...resto,
    magiasSempre: Object.fromEntries(magiasDeDominio.map(([a, b], i) => [[1, 3, 5, 7, 9][i]!, m(a, b)])),
  }
}

/** Clérigo (LdJ p. 63–70). Resumos em palavras próprias. */
export const CLERIGO: Classe = {
  id: 'clerigo',
  nome: 'Clérigo',
  pagina: 63,
  dadoDeVida: 8,
  resistencias: ['sab', 'car'],
  armaduras: ['leve', 'media', 'escudo'],
  armas: { categorias: ['simples'], especificas: [] },
  ferramentas: [],
  pericias: { quantidade: 2, opcoes: ['historia', 'intuicao', 'medicina', 'persuasao', 'religiao'] },
  equipamentoFixo: [
    { itemId: 'escudo', quantidade: 1 },
    { itemId: 'simboloSagrado', quantidade: 1 },
  ],
  equipamentoEscolhas: [
    {
      id: 'arma',
      opcoes: [
        { rotulo: 'Maça', itens: [{ itemId: 'maca', quantidade: 1 }] },
        { rotulo: 'Martelo de guerra (se tiver proficiência)', itens: [{ itemId: 'marteloDeGuerra', quantidade: 1 }] },
      ],
    },
    {
      id: 'armadura',
      opcoes: [
        { rotulo: 'Brunea', itens: [{ itemId: 'brunea', quantidade: 1 }] },
        { rotulo: 'Armadura de couro', itens: [{ itemId: 'couro', quantidade: 1 }] },
        { rotulo: 'Cota de malha (se tiver proficiência)', itens: [{ itemId: 'cotaDeMalha', quantidade: 1 }] },
      ],
    },
    {
      id: 'distancia',
      opcoes: [
        { rotulo: 'Besta leve e 20 virotes', itens: [{ itemId: 'bestaLeve', quantidade: 1 }, { itemId: 'virotes', quantidade: 20 }] },
        { rotulo: 'Qualquer arma simples', itens: [{ itemId: 'qualquer:simples', quantidade: 1 }] },
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
    { nivel: 1, id: 'clerigo-conjuracao', nome: 'Conjuração', pagina: 65, resumo: 'Prepara magias de clérigo (Sabedoria + nível) após descanso longo; conjura rituais preparados. CD = 8 + prof. + Sab.' },
    { nivel: 1, id: 'clerigo-dominio', nome: 'Domínio Divino', pagina: 65, resumo: 'Escolha do domínio, que dá magias sempre preparadas e habilidades no 1º, 2º, 6º, 8º e 17º níveis.' },
    { nivel: 2, id: 'clerigo-canalizar', nome: 'Canalizar Divindade', pagina: 65, resumo: 'Energia divina para efeitos do domínio. Um uso por descanso curto; dois no 6º e três no 18º.' },
    { nivel: 2, id: 'clerigo-expulsar', nome: 'Expulsar Mortos-Vivos', pagina: 66, resumo: 'Mortos-vivos a 9 m que vejam ou ouçam você fazem resistência de Sab ou fogem por 1 minuto.' },
    { nivel: 5, id: 'clerigo-destruir', nome: 'Destruir Mortos-Vivos', pagina: 66, resumo: 'Expulsar destrói na hora mortos-vivos de ND baixo: 1/2 no 5º, 1 no 8º, 2 no 11º, 3 no 14º e 4 no 17º.' },
    { nivel: 10, id: 'clerigo-intervencao', nome: 'Intervenção Divina', pagina: 66, resumo: 'Pede ajuda à divindade: acontece se rolar no d100 até o seu nível. Se der certo, espera 7 dias; se não, até o próximo descanso longo. Automática no 20º.' },
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 1,
  nomeSubclasse: 'Domínio Divino',
  conjuracao: { tipo: 'completo', atributo: 'sab' },
  magias: {
    truques: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    preparadas: ({ nivel, mod }) => Math.max(1, mod.sab + nivel),
  },
  recursos: ({ nivel }) =>
    nivel >= 2
      ? [{ id: 'canalizar', nome: 'Canalizar Divindade', maximo: nivel >= 18 ? 3 : nivel >= 6 ? 2 : 1, recarga: 'curto', detalhe: 'expulsar mortos-vivos ou opção do domínio', pagina: 65 }]
      : [],
  extras: ({ nivel }) => [
    ...(ndDestruirMortosVivos(nivel) ? [{ nome: 'Destruir mortos-vivos', valor: `ND ${ndDestruirMortosVivos(nivel)} ou menor` }] : []),
    ...(nivel >= 10 ? [{ nome: 'Intervenção divina', valor: nivel >= 20 ? 'automática' : `d100 ≤ ${nivel}` }] : []),
  ],
  subclasses: [
    {
      ...dominio({
      id: 'conhecimento',
      nome: 'Domínio do Conhecimento',
      pagina: 66,
      resumo: 'Saber, aprendizado e segredos.',
      magiasDeDominio: [['comando', 'identificação'], ['augúrio', 'sugestão'], ['dificultar detecção', 'falar com os mortos'], ['olho arcano', 'confusão'], ['conhecimento lendário', 'vidência']],
      habilidades: [
        { nivel: 1, id: 'conhecimento-bencaos', nome: 'Bênçãos do Conhecimento', pagina: 66, resumo: 'Dois idiomas e proficiência com bônus dobrado em duas perícias entre Arcanismo, História, Natureza e Religião.' },
        { nivel: 2, id: 'conhecimento-eras', nome: 'Canalizar Divindade: Conhecimento das Eras', pagina: 66, resumo: 'Proficiência numa perícia ou ferramenta por 10 minutos.' },
        { nivel: 6, id: 'conhecimento-pensamentos', nome: 'Canalizar Divindade: Ler Pensamentos', pagina: 67, resumo: 'Lê os pensamentos de uma criatura (Sab evita) e pode conjurar sugestão nela sem gastar espaço.' },
        { nivel: 8, id: 'conhecimento-poderosa', nome: 'Conjuração Poderosa', pagina: 67, resumo: 'Soma Sabedoria no dano dos truques de clérigo.' },
        { nivel: 17, id: 'conhecimento-visoes', nome: 'Visões do Passado', pagina: 67, resumo: 'Meditando, vê eventos recentes ligados a um objeto ou lugar.' },
      ],
      }),
      escolhas: [
        ...escolhasEmSerie(
          'bencaoPericia',
          'Bênçãos do Conhecimento: perícia',
          66,
          [1, 1],
          (['arcanismo', 'historia', 'natureza', 'religiao'] as const).map((id) => ({ id, nome: NOME_PERICIA[id], resumo: 'Proficiência com o bônus dobrado.' })),
        ),
        ...escolhasEmSerie(
          'bencaoIdioma',
          'Bênçãos do Conhecimento: idioma',
          66,
          [1, 1],
          [...IDIOMAS.padrao, ...IDIOMAS.exoticos].map((x) => ({ id: x, nome: x, resumo: '' })),
        ),
      ],
      periciasExtras: ({ escolhas }) => valoresDaSerie('bencaoPericia', escolhas) as PericiaId[],
      especializacoesExtras: ({ escolhas }) => valoresDaSerie('bencaoPericia', escolhas) as PericiaId[],
      idiomasExtras: ({ escolhas }) => valoresDaSerie('bencaoIdioma', escolhas),
    },
    dominio({
      id: 'enganacao',
      nome: 'Domínio da Enganação',
      pagina: 67,
      resumo: 'Travessura, ilusão e subversão.',
      magiasDeDominio: [['enfeitiçar pessoa', 'disfarçar-se'], ['reflexos', 'passos sem pegadas'], ['piscar', 'dissipar magia'], ['porta dimensional', 'metamorfose'], ['dominar pessoa', 'modificar memória']],
      habilidades: [
        { nivel: 1, id: 'enganacao-bencao', nome: 'Bênção do Trapaceiro', pagina: 67, resumo: 'Toque: uma criatura ganha vantagem em Furtividade por 1 hora.' },
        { nivel: 2, id: 'enganacao-duplicidade', nome: 'Canalizar Divindade: Invocar Duplicidade', pagina: 68, resumo: 'Cria uma cópia ilusória de você que pode servir de ponto de origem das magias e dá vantagem nos ataques contra quem estiver perto dela.' },
        { nivel: 6, id: 'enganacao-sombras', nome: 'Canalizar Divindade: Manto de Sombras', pagina: 68, resumo: 'Fica invisível até o fim do próximo turno.' },
        { nivel: 8, id: 'enganacao-golpe', nome: 'Golpe Divino', pagina: 68, resumo: 'Uma vez por turno, +1d8 de veneno ao acertar com arma (2d8 no 14º).' },
        { nivel: 17, id: 'enganacao-aprimorada', nome: 'Duplicidade Aprimorada', pagina: 68, resumo: 'Até quatro cópias ao usar Invocar Duplicidade.' },
      ],
    }),
    {
      ...dominio({
        id: 'guerra',
        nome: 'Domínio da Guerra',
        pagina: 68,
        resumo: 'Excelência em combate e bravura.',
        magiasDeDominio: [['auxílio divino', 'escudo da fé'], ['arma mágica', 'arma espiritual'], ['manto do cruzado', 'espíritos guardiões'], ['movimentação livre', 'pele de pedra'], ['coluna de chamas', 'imobilizar monstro']],
        habilidades: [
          { nivel: 1, id: 'guerra-proficiencia', nome: 'Proficiência Adicional', pagina: 68, resumo: 'Armas marciais e armaduras pesadas.' },
          { nivel: 1, id: 'guerra-sacerdote', nome: 'Sacerdote da Guerra', pagina: 68, resumo: 'Ao usar a ação de Ataque, um ataque com arma extra como ação bônus. Usos = Sab por descanso longo.' },
          { nivel: 2, id: 'guerra-dirigido', nome: 'Canalizar Divindade: Ataque Dirigido', pagina: 68, resumo: '+10 numa jogada de ataque, depois de ver o dado.' },
          { nivel: 6, id: 'guerra-bencao', nome: 'Canalizar Divindade: Bênção do Deus da Guerra', pagina: 68, resumo: 'Reação: +10 no ataque de uma criatura a 9 m.' },
          { nivel: 8, id: 'guerra-golpe', nome: 'Golpe Divino', pagina: 68, resumo: 'Uma vez por turno, +1d8 do tipo da arma ao acertar (2d8 no 14º).' },
          { nivel: 17, id: 'guerra-avatar', nome: 'Avatar da Batalha', pagina: 68, resumo: 'Resistência a dano de concussão, cortante e perfurante não mágico.' },
        ],
      }),
      armaduras: ['pesada'],
      armasCategorias: ['marcial'],
      recursos: ({ mod }) => [{ id: 'sacerdote-guerra', nome: 'Sacerdote da Guerra', maximo: Math.max(1, mod.sab), recarga: 'longo', detalhe: 'ataque extra como ação bônus', pagina: 68 }],
    },
    dominio({
      id: 'luz',
      nome: 'Domínio da Luz',
      pagina: 68,
      resumo: 'Renovação, verdade e fogo.',
      magiasDeDominio: [['mãos flamejantes', 'fogo das fadas'], ['esfera flamejante', 'raio ardente'], ['luz do dia', 'bola de fogo'], ['guardião da fé', 'muralha de fogo'], ['coluna de chamas', 'vidência']],
      recursos: ({ mod }) => [{ id: 'labareda', nome: 'Labareda Protetora', maximo: Math.max(1, mod.sab), recarga: 'longo', detalhe: 'desvantagem num ataque contra você', pagina: 69 }],
      habilidades: [
        { nivel: 1, id: 'luz-truque', nome: 'Truque Adicional', pagina: 69, resumo: 'Conhece o truque luz.' },
        { nivel: 1, id: 'luz-labareda', nome: 'Labareda Protetora', pagina: 69, resumo: 'Reação: impõe desvantagem num ataque de quem você vê a 9 m. Usos = Sab por descanso longo.' },
        { nivel: 2, id: 'luz-amanhecer', nome: 'Canalizar Divindade: Radiação do Amanhecer', pagina: 69, resumo: 'Dissipa escuridão mágica a 9 m e causa 2d10 + nível radiante a hostis (Con reduz).' },
        { nivel: 6, id: 'luz-aprimorada', nome: 'Labareda Aprimorada', pagina: 69, resumo: 'A Labareda Protetora também protege aliados.' },
        { nivel: 8, id: 'luz-poderosa', nome: 'Conjuração Poderosa', pagina: 69, resumo: 'Soma Sabedoria no dano dos truques de clérigo.' },
        { nivel: 17, id: 'luz-coroa', nome: 'Coroa de Luz', pagina: 69, resumo: 'Aura de luz solar: inimigos nela têm desvantagem contra suas magias de fogo e radiantes.' },
      ],
    }),
    {
      ...dominio({
        id: 'natureza',
        nome: 'Domínio da Natureza',
        pagina: 69,
        resumo: 'As forças da natureza e os seres selvagens.',
        magiasDeDominio: [['amizade animal', 'falar com animais'], ['pele de árvore', 'crescer espinhos'], ['ampliar plantas', 'muralha de vento'], ['dominar besta', 'vinha esmagadora'], ['praga de insetos', 'caminhar em árvores']],
        habilidades: [
          { nivel: 1, id: 'natureza-acolito', nome: 'Acólito da Natureza', pagina: 69, resumo: 'Um truque de druida (fora do limite de truques) e proficiência em Adestrar Animais, Natureza ou Sobrevivência.' },
          { nivel: 1, id: 'natureza-proficiencia', nome: 'Proficiência Adicional', pagina: 69, resumo: 'Armaduras pesadas.' },
          { nivel: 2, id: 'natureza-enfeiticar', nome: 'Canalizar Divindade: Enfeitiçar Animais e Plantas', pagina: 69, resumo: 'Bestas e plantas a 9 m fazem resistência de Sab ou ficam enfeitiçadas por 1 minuto.' },
          { nivel: 6, id: 'natureza-amortecer', nome: 'Amortecer Elementos', pagina: 69, resumo: 'Reação: dá resistência a ácido, frio, fogo, elétrico ou trovejante a uma criatura a 9 m.' },
          { nivel: 8, id: 'natureza-golpe', nome: 'Golpe Divino', pagina: 69, resumo: 'Uma vez por turno, +1d8 de frio, fogo ou elétrico ao acertar com arma (2d8 no 14º).' },
          { nivel: 17, id: 'natureza-senhor', nome: 'Senhor da Natureza', pagina: 69, resumo: 'Comanda as criaturas enfeitiçadas pelo Canalizar Divindade.' },
        ],
      }),
      armaduras: ['pesada'],
      escolhas: [
        {
          id: 'acolitoPericia',
          nivel: 1,
          rotulo: 'Acólito da Natureza: perícia',
          pagina: 69,
          opcoes: (['adestrarAnimais', 'natureza', 'sobrevivencia'] as const).map((id) => ({ id, nome: NOME_PERICIA[id], resumo: 'Proficiência.' })),
        },
        {
          id: 'acolitoTruque',
          nivel: 1,
          rotulo: 'Acólito da Natureza: truque de druida',
          pagina: 69,
          opcoes: TRUQUES_DE_DRUIDA.map((x) => ({ id: x.id, nome: x.nome, resumo: x.resumo })),
        },
      ],
      periciasExtras: ({ escolhas }) => (escolhas.acolitoPericia ? [escolhas.acolitoPericia as PericiaId] : []),
      // O truque escolhido fica sempre conhecido, fora do limite de truques.
      magiasPorEscolha: { escolha: 'acolitoTruque', porOpcao: Object.fromEntries(TRUQUES_DE_DRUIDA.map((x) => [x.id, { 1: [x.id] }])) },
    },
    {
      ...dominio({
        id: 'tempestade',
        nome: 'Domínio da Tempestade',
        pagina: 69,
        resumo: 'Trovão, relâmpago e o mar.',
        magiasDeDominio: [['névoa obscurecente', 'onda trovejante'], ['lufada de vento', 'despedaçar'], ['convocar relâmpagos', 'nevasca'], ['controlar a água', 'tempestade de gelo'], ['onda destrutiva', 'praga de insetos']],
        habilidades: [
          { nivel: 1, id: 'tempestade-proficiencia', nome: 'Proficiência Adicional', pagina: 70, resumo: 'Armas marciais e armaduras pesadas.' },
          { nivel: 1, id: 'tempestade-ira', nome: 'Ira da Tormenta', pagina: 70, resumo: 'Reação ao ser atingido a 1,5 m: 2d8 elétrico ou trovejante no atacante (Des reduz). Usos = Sab por descanso longo.' },
          { nivel: 2, id: 'tempestade-destruidora', nome: 'Canalizar Divindade: Ira Destruidora', pagina: 70, resumo: 'Ao causar dano elétrico ou trovejante, causa o máximo.' },
          { nivel: 6, id: 'tempestade-relampago', nome: 'Golpe de Relâmpago', pagina: 70, resumo: 'Dano elétrico pode empurrar criaturas Grandes ou menores 3 m.' },
          { nivel: 8, id: 'tempestade-golpe', nome: 'Golpe Divino', pagina: 70, resumo: 'Uma vez por turno, +1d8 trovejante ao acertar com arma (2d8 no 14º).' },
          { nivel: 17, id: 'tempestade-filho', nome: 'Filho da Tormenta', pagina: 70, resumo: 'Voo igual ao deslocamento quando não está no subterrâneo nem em ambiente fechado.' },
        ],
      }),
      armaduras: ['pesada'],
      armasCategorias: ['marcial'],
      recursos: ({ mod }) => [{ id: 'ira-tormenta', nome: 'Ira da Tormenta', maximo: Math.max(1, mod.sab), recarga: 'longo', detalhe: '2d8 elétrico ou trovejante', pagina: 70 }],
    },
    {
      ...dominio({
        id: 'vida',
        nome: 'Domínio da Vida',
        pagina: 70,
        resumo: 'A energia positiva que sustenta toda a vida.',
        magiasDeDominio: [['bênção', 'curar ferimentos'], ['restauração menor', 'arma espiritual'], ['sinal de esperança', 'revivificar'], ['proteção contra a morte', 'guardião da fé'], ['curar ferimentos em massa', 'reviver os mortos']],
        habilidades: [
          { nivel: 1, id: 'vida-proficiencia', nome: 'Proficiência Adicional', pagina: 70, resumo: 'Armaduras pesadas.' },
          { nivel: 1, id: 'vida-discipulo', nome: 'Discípulo da Vida', pagina: 70, resumo: 'Magias de cura de 1º nível ou mais curam +2 + nível da magia.' },
          { nivel: 2, id: 'vida-preservar', nome: 'Canalizar Divindade: Preservar a Vida', pagina: 70, resumo: 'Distribui cura igual a 5 × nível entre criaturas a 9 m, até metade do PV máximo de cada.' },
          { nivel: 6, id: 'vida-abencoado', nome: 'Curandeiro Abençoado', pagina: 70, resumo: 'Ao curar outra criatura com magia, você cura 2 + nível da magia.' },
          { nivel: 8, id: 'vida-golpe', nome: 'Golpe Divino', pagina: 70, resumo: 'Uma vez por turno, +1d8 radiante ao acertar com arma (2d8 no 14º).' },
          { nivel: 17, id: 'vida-suprema', nome: 'Cura Suprema', pagina: 70, resumo: 'Usa o valor máximo dos dados de cura.' },
        ],
      }),
      armaduras: ['pesada'],
    },
  ],
}
