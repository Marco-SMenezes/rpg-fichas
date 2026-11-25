import type { Classe, EscolhaDeClasse } from '../tipos'
import { escolhasEmSerie, escolhidosDaSerie } from './escolhas'
import { ANCESTRAIS_DRACONICOS } from './racas'

export function opcoesDeMetamagia(nivel: number): number {
  return nivel >= 17 ? 4 : nivel >= 10 ? 3 : nivel >= 3 ? 2 : 0
}

/** Opções de Metamágica (LdJ p. 79–80). Resumos em palavras próprias. */
export const METAMAGIAS: EscolhaDeClasse['opcoes'] = [
  ['acelerada', 'Magia Acelerada', 79, '2 pontos: magia de 1 ação vira ação bônus.'],
  ['aumentada', 'Magia Aumentada', 79, '3 pontos: um alvo tem desvantagem no primeiro teste de resistência contra a magia.'],
  ['cuidadosa', 'Magia Cuidadosa', 80, '1 ponto: até Car criaturas (mín. 1) passam automaticamente no teste de resistência.'],
  ['distante', 'Magia Distante', 80, '1 ponto: dobra o alcance; magia de toque passa a alcançar 9 m.'],
  ['duplicada', 'Magia Duplicada', 80, 'Pontos iguais ao nível da magia (1 para truque): uma magia de alvo único pega um segundo alvo.'],
  ['estendida', 'Magia Estendida', 80, '1 ponto: dobra a duração de 1 minuto ou mais (máx. 24 h).'],
  ['potencializada', 'Magia Potencializada', 80, '1 ponto: rola de novo até Car dados de dano (mín. 1). Combina com outra opção.'],
  ['sutil', 'Magia Sutil', 80, '1 ponto: conjura sem componentes verbais nem somáticos.'],
].map(([id, nome, pagina, resumo]) => ({ id: String(id), nome: `${nome} (p. ${pagina})`, resumo: String(resumo) }))

/** Feiticeiro (LdJ p. 77–82). Resumos em palavras próprias. */
export const FEITICEIRO: Classe = {
  id: 'feiticeiro',
  nome: 'Feiticeiro',
  pagina: 77,
  dadoDeVida: 6,
  resistencias: ['con', 'car'],
  armaduras: [],
  armas: { categorias: [], especificas: ['adaga', 'dardo', 'funda', 'bordao', 'bestaLeve'] },
  ferramentas: [],
  pericias: { quantidade: 2, opcoes: ['arcanismo', 'enganacao', 'intuicao', 'intimidacao', 'persuasao', 'religiao'] },
  equipamentoFixo: [{ itemId: 'adaga', quantidade: 2 }],
  equipamentoEscolhas: [
    {
      id: 'arma',
      opcoes: [
        { rotulo: 'Besta leve e 20 virotes', itens: [{ itemId: 'bestaLeve', quantidade: 1 }, { itemId: 'virotes', quantidade: 20 }] },
        { rotulo: 'Qualquer arma simples', itens: [{ itemId: 'qualquer:simples', quantidade: 1 }] },
      ],
    },
    {
      id: 'foco',
      opcoes: [
        { rotulo: 'Bolsa de componentes', itens: [{ itemId: 'bolsaDeComponentes', quantidade: 1 }] },
        { rotulo: 'Foco arcano', itens: [{ itemId: 'focoArcano', quantidade: 1 }] },
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
    { nivel: 1, id: 'feiticeiro-conjuracao', nome: 'Conjuração', pagina: 79, resumo: 'Conhece magias de feiticeiro e conjura com Carisma. Ao subir de nível, pode trocar uma magia conhecida.' },
    { nivel: 1, id: 'feiticeiro-origem', nome: 'Origem de Feitiçaria', pagina: 79, resumo: 'Escolha da origem (Linhagem Dracônica ou Magia Selvagem), com habilidades no 1º, 6º, 14º e 18º níveis.' },
    { nivel: 2, id: 'feiticeiro-fonte', nome: 'Fonte de Magia', pagina: 79, resumo: 'Pontos de feitiçaria iguais ao nível, que voltam no descanso longo. Ação bônus: transforma espaços em pontos ou pontos em espaços (2 pontos = 1º, 3 = 2º, 5 = 3º, 6 = 4º, 7 = 5º).' },
    { nivel: 3, id: 'feiticeiro-metamagia', nome: 'Metamagia', pagina: 79, resumo: 'Duas opções para moldar magias com pontos (acelerada, aumentada, cuidadosa, distante, duplicada, estendida, potencializada, sutil). Mais uma no 10º e no 17º.' },
    { nivel: 20, id: 'feiticeiro-restauracao', nome: 'Restauração Mística', pagina: 80, resumo: 'Recupera 4 pontos de feitiçaria num descanso curto.' },
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 1,
  nomeSubclasse: 'Origem de Feitiçaria',
  conjuracao: { tipo: 'completo', atributo: 'car' },
  magias: {
    truques: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    conhecidas: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  },
  recursos: ({ nivel }) =>
    nivel >= 2 ? [{ id: 'pontos-feiticaria', nome: 'Pontos de feitiçaria', maximo: nivel, recarga: 'longo', detalhe: 'metamagia e espaços', pagina: 79 }] : [],
  escolhas: escolhasEmSerie('metamagia', 'Metamágica', 79, [3, 3, 10, 17], METAMAGIAS),
  extras: ({ nivel, escolhas }) =>
    nivel >= 3 ? [{ nome: `Metamágica (${opcoesDeMetamagia(nivel)})`, valor: escolhidosDaSerie('metamagia', escolhas, METAMAGIAS) }] : [],
  subclasses: [
    {
      id: 'draconica',
      nome: 'Linhagem Dracônica',
      pagina: 80,
      resumo: 'Magia herdada de um ancestral dragão.',
      ferramentas: [],
      pvPorNivel: 1,
      defesaSemArmadura: { base: 13, permiteEscudo: true },
      escolhas: [
        {
          id: 'ancestralDraconico',
          nivel: 1,
          rotulo: 'Ancestral Dracônico',
          pagina: 80,
          opcoes: ANCESTRAIS_DRACONICOS.map((a) => ({ id: a.id, nome: a.nome, resumo: `Dano ${a.dano}.` })),
        },
      ],
      extras: ({ escolhas }) => {
        const a = ANCESTRAIS_DRACONICOS.find((x) => x.id === escolhas.ancestralDraconico)
        return a ? [{ nome: 'Afinidade elemental (6º)', valor: `+Car no dano de ${a.dano}` }] : []
      },
      habilidades: [
        { nivel: 1, id: 'draconica-ancestral', nome: 'Ancestral Dracônico', pagina: 80, resumo: 'Fala Dracônico e dobra a proficiência em testes de Carisma com dragões.' },
        { nivel: 1, id: 'draconica-resiliencia', nome: 'Resiliência Dracônica', pagina: 80, resumo: '+1 PV por nível de feiticeiro e, sem armadura, CA = 13 + Des.' },
        { nivel: 6, id: 'draconica-afinidade', nome: 'Afinidade Elemental', pagina: 80, resumo: 'Soma Carisma no dano de magias do tipo do ancestral; 1 ponto de feitiçaria dá resistência a esse tipo por 1 hora.' },
        { nivel: 14, id: 'draconica-asas', nome: 'Asas de Dragão', pagina: 81, resumo: 'Ação bônus: asas com voo igual ao deslocamento.' },
        { nivel: 18, id: 'draconica-presenca', nome: 'Presença Dracônica', pagina: 81, resumo: '5 pontos: aura de 18 m que amedronta ou encanta (Sab evita) por 1 minuto.' },
      ],
    },
    {
      id: 'selvagem',
      nome: 'Magia Selvagem',
      pagina: 81,
      resumo: 'Magia caótica e imprevisível.',
      ferramentas: [],
      recursos: () => [{ id: 'mares-caos', nome: 'Marés do Caos', maximo: 1, recarga: 'longo', detalhe: 'vantagem numa jogada', pagina: 81 }],
      habilidades: [
        { nivel: 1, id: 'selvagem-surto', nome: 'Surto de Magia Selvagem', pagina: 81, resumo: 'Após conjurar magia de 1º nível ou mais, o Mestre pode pedir um d20: com 1, rola na tabela de Surto de Magia Selvagem.' },
        { nivel: 1, id: 'selvagem-mares', nome: 'Marés do Caos', pagina: 81, resumo: 'Vantagem num ataque, teste ou resistência; volta no descanso longo ou quando o Mestre provoca um surto.' },
        { nivel: 6, id: 'selvagem-sorte', nome: 'Dobrar a Sorte', pagina: 81, resumo: 'Reação e 2 pontos: soma ou subtrai 1d4 da jogada de outra criatura.' },
        { nivel: 14, id: 'selvagem-caos', nome: 'Caos Controlado', pagina: 81, resumo: 'Rola duas vezes na tabela de surto e escolhe.' },
        { nivel: 18, id: 'selvagem-bombardeio', nome: 'Bombardeio de Magia', pagina: 81, resumo: 'Ao tirar o máximo num dado de dano de magia, rola mais um daquele dado, uma vez por turno.' },
      ],
    },
  ],
}
