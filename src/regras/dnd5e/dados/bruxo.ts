import type { Classe, EscolhaDeClasse } from '../tipos'
import { magias as m } from './nomesDeMagias'

interface Invocacao {
  nome: string
  resumo: string
  /** Nível de bruxo exigido. */
  nivel?: number
  pacto?: 'corrente' | 'lamina' | 'tomo'
  /** Exige o truque rajada mística. */
  rajada?: true
}

const NOME_PACTO = { corrente: 'Pacto da Corrente', lamina: 'Pacto da Lâmina', tomo: 'Pacto do Tomo' }

/** Invocações Místicas (LdJ p. 61–62): nome, resumo e pré-requisitos. */
const INVOCACOES: Invocacao[] = [
  { nome: 'Armadura de Sombras', resumo: 'Armadura arcana em si mesmo à vontade.', pacto: 'tomo' },
  { nome: 'Correntes de Cárceri', resumo: 'Imobilizar monstro em celestial, corruptor ou elemental à vontade.', nivel: 15, pacto: 'corrente' },
  { nome: 'Encharcar a Mente', resumo: 'Lentidão uma vez por descanso longo com espaço de bruxo.', nivel: 5 },
  { nome: 'Escultor de Carne', resumo: 'Metamorfose uma vez por descanso longo com espaço de bruxo.', nivel: 7 },
  { nome: 'Explosão Agonizante', resumo: 'Soma Carisma no dano da rajada mística.', rajada: true },
  { nome: 'Explosão Repulsiva', resumo: 'A rajada mística empurra o alvo 3 m.', rajada: true },
  { nome: 'Idioma Bestial', resumo: 'Falar com animais à vontade.' },
  { nome: 'Influência Enganadora', resumo: 'Proficiência em Enganação e Persuasão.' },
  { nome: 'Lacaios do Caos', resumo: 'Conjurar elemental uma vez por descanso longo com espaço de bruxo.', nivel: 9 },
  { nome: 'Lâmina Sedenta', resumo: 'Dois ataques com a arma do pacto por ação de Ataque.', nivel: 5, pacto: 'lamina' },
  { nome: 'Lança Mística', resumo: 'Rajada mística com alcance de 90 m.', rajada: true },
  { nome: 'Larápio dos Cinco Destinos', resumo: 'Perdição uma vez por descanso longo com espaço de bruxo.' },
  { nome: 'Livro de Segredos Antigos', resumo: 'Registra e conjura rituais de qualquer classe no Livro das Sombras.', pacto: 'tomo' },
  { nome: 'Máscara das Muitas Faces', resumo: 'Disfarçar-se à vontade.' },
  { nome: 'Mestre das Infindáveis Formas', resumo: 'Alterar-se à vontade.', nivel: 15 },
  { nome: 'Olhar de Duas Mentes', resumo: 'Percebe pelos sentidos de um humanoide voluntário que tocar.' },
  { nome: 'Olhos do Guardião das Runas', resumo: 'Lê todas as escritas.' },
  { nome: 'Palavra Terrível', resumo: 'Confusão uma vez por descanso longo com espaço de bruxo.', nivel: 7 },
  { nome: 'Passo Ascendente', resumo: 'Levitação em si mesmo à vontade.', nivel: 9 },
  { nome: 'Salto Transcendental', resumo: 'Salto em si mesmo à vontade.', nivel: 9 },
  { nome: 'Sinal de Mau Agouro', resumo: 'Rogar maldição uma vez por descanso longo com espaço de bruxo.', nivel: 5 },
  { nome: 'Sorvedor de Vida', resumo: 'A arma do pacto causa necrótico extra igual ao Carisma.', nivel: 12, pacto: 'lamina' },
  { nome: 'Sussurros da Sepultura', resumo: 'Falar com os mortos à vontade.', nivel: 9 },
  { nome: 'Sussurros Sedutores', resumo: 'Compulsão uma vez por descanso longo com espaço de bruxo.', nivel: 7 },
  { nome: 'Uno com as Sombras', resumo: 'Na penumbra ou escuridão, fica invisível parado.', nivel: 5 },
  { nome: 'Vigor Abissal', resumo: 'Vitalidade falsa em si mesmo à vontade.' },
  { nome: 'Visão da Bruxa', resumo: 'Vê a forma verdadeira de metamorfos e ilusões a 9 m.', nivel: 15 },
  { nome: 'Visão Diabólica', resumo: 'Enxerga no escuro, mágico ou não, a 36 m.' },
  { nome: 'Visão Mística', resumo: 'Detectar magia à vontade.' },
  { nome: 'Visões de Reinos Distantes', resumo: 'Olho arcano à vontade.', nivel: 15 },
  { nome: 'Visões nas Brumas', resumo: 'Imagem silenciosa à vontade.' },
  { nome: 'Voz do Mestre das Correntes', resumo: 'Telepatia e sentidos compartilhados com o familiar.', pacto: 'corrente' },
]

export const NIVEIS_DE_INVOCACAO = [2, 2, 5, 7, 9, 12, 15, 18]

function requisitos(i: Invocacao): string {
  const r = [i.nivel && `${i.nivel}º nível`, i.pacto && NOME_PACTO[i.pacto], i.rajada && 'truque rajada mística'].filter(Boolean)
  return r.length ? ` Requer: ${r.join(', ')}.` : ''
}

const invocacao = (n: number): EscolhaDeClasse => ({
  id: `invocacao${n + 1}`,
  nivel: NIVEIS_DE_INVOCACAO[n]!,
  rotulo: `Invocação Mística ${n + 1}`,
  pagina: 61,
  opcoes: INVOCACOES.map((i) => ({
    id: i.nome,
    nome: i.nome,
    resumo: i.resumo + requisitos(i),
    ...(i.nivel ? { nivelMinimo: i.nivel } : {}),
    // A Dádiva do Pacto é escolhida no 3º nível.
    ...(i.pacto ? { exigeEscolha: { id: 'pacto', valor: i.pacto, nivel: 3, nome: NOME_PACTO[i.pacto] } } : {}),
    ...(i.rajada ? { exigeMagia: 'rajada-mistica' } : {}),
  })),
})

export function invocacoesConhecidas(nivel: number): number {
  return NIVEIS_DE_INVOCACAO.filter((n) => n <= nivel).length
}

const expandida = (...pares: [string, string][]) => Object.fromEntries(pares.map(([a, b], i) => [i + 1, m(a, b)]))

/** Bruxo (LdJ p. 56–62). Resumos em palavras próprias. */
export const BRUXO: Classe = {
  id: 'bruxo',
  nome: 'Bruxo',
  pagina: 56,
  dadoDeVida: 8,
  resistencias: ['sab', 'car'],
  armaduras: ['leve'],
  armas: { categorias: ['simples'], especificas: [] },
  ferramentas: [],
  pericias: { quantidade: 2, opcoes: ['arcanismo', 'enganacao', 'historia', 'intimidacao', 'investigacao', 'natureza', 'religiao'] },
  equipamentoFixo: [
    { itemId: 'couro', quantidade: 1 },
    { itemId: 'adaga', quantidade: 2 },
  ],
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
        { rotulo: 'Pacote de estudioso', itens: [{ itemId: 'pacoteEstudioso', quantidade: 1 }] },
        { rotulo: 'Pacote de aventureiro', itens: [{ itemId: 'pacoteAventureiro', quantidade: 1 }] },
      ],
    },
    {
      id: 'arma-extra',
      opcoes: [{ rotulo: 'Qualquer arma simples', itens: [{ itemId: 'qualquer:simples', quantidade: 1 }] }],
    },
  ],
  periciasExtras: ({ escolhas }) =>
    Object.entries(escolhas).some(([k, v]) => k.startsWith('invocacao') && v === 'Influência Enganadora') ? ['enganacao', 'persuasao'] : [],
  // A cada nível de bruxo, pode trocar uma invocação conhecida (LdJ p. 58).
  trocas: [{ prefixo: 'invocacao', nome: 'invocação', pagina: 58, niveis: Array.from({ length: 18 }, (_, i) => i + 3) }],
  escolhas: [
    ...Array.from({ length: 8 }, (_, i) => invocacao(i)),
    {
      id: 'pacto',
      nivel: 3,
      rotulo: 'Dádiva do Pacto',
      pagina: 58,
      opcoes: [
        { id: 'corrente', nome: 'Pacto da Corrente', resumo: 'Convocar familiar com formas especiais (diabrete, pseudodragão, quasit, sprite); ele pode atacar no lugar do seu ataque.' },
        { id: 'lamina', nome: 'Pacto da Lâmina', resumo: 'Cria uma arma corpo a corpo mágica do pacto, com proficiência, ou vincula uma arma mágica.' },
        { id: 'tomo', nome: 'Pacto do Tomo', resumo: 'Livro das Sombras com três truques de qualquer classe.' },
      ],
    },
  ],
  habilidades: [
    { nivel: 1, id: 'bruxo-patrono', nome: 'Patrono Transcendental', pagina: 58, resumo: 'Pacto com um patrono (Arquifada, Corruptor ou Grande Antigo), com habilidades no 1º, 6º, 10º e 14º níveis e magias extras na lista.' },
    { nivel: 1, id: 'bruxo-pacto', nome: 'Magia de Pacto', pagina: 58, resumo: 'Poucos espaços, todos do nível mais alto que você conjura, e que voltam no descanso curto. Conjura com Carisma.' },
    { nivel: 2, id: 'bruxo-invocacoes', nome: 'Invocações Místicas', pagina: 58, resumo: 'Duas invocações; mais no 5º, 7º, 9º, 12º, 15º e 18º níveis. Pode trocar uma a cada nível.' },
    { nivel: 3, id: 'bruxo-dadiva', nome: 'Dádiva do Pacto', pagina: 58, resumo: 'Corrente (familiar especial), Lâmina (arma do pacto) ou Tomo (três truques extras).' },
    { nivel: 11, id: 'bruxo-arcana', nome: 'Arcana Mística', pagina: 59, resumo: 'Uma magia de 6º nível conjurada uma vez por descanso longo sem espaço; 7º no 13º, 8º no 15º e 9º no 17º.' },
    { nivel: 20, id: 'bruxo-mestre', nome: 'Mestre Místico', pagina: 59, resumo: 'Com 1 minuto implorando ao patrono, recupera todos os espaços de pacto. Uma vez por descanso longo.' },
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 1,
  nomeSubclasse: 'Patrono Transcendental',
  conjuracao: { tipo: 'pacto', atributo: 'car' },
  magias: {
    truques: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    conhecidas: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    nivelMaximoExtra: (nivel) => (nivel >= 17 ? 9 : nivel >= 15 ? 8 : nivel >= 13 ? 7 : nivel >= 11 ? 6 : 0),
  },
  recursos: ({ nivel }) => [
    ...[
      [11, 6],
      [13, 7],
      [15, 8],
      [17, 9],
    ]
      .filter(([n]) => nivel >= n!)
      .map(([, c]) => ({ id: `arcana-${c}`, nome: `Arcana Mística (${c}º)`, maximo: 1, recarga: 'longo' as const, detalhe: 'sem gastar espaço', pagina: 59 })),
    ...(nivel >= 20 ? [{ id: 'mestre-mistico', nome: 'Mestre Místico', maximo: 1, recarga: 'longo' as const, detalhe: 'recupera os espaços de pacto', pagina: 59 }] : []),
  ],
  extras: ({ nivel, escolhas }) => [
    ...(nivel >= 2 ? [{ nome: 'Invocações conhecidas', valor: String(invocacoesConhecidas(nivel)) }] : []),
    ...(escolhas.pacto ? [{ nome: 'Dádiva do pacto', valor: { corrente: 'Corrente', lamina: 'Lâmina', tomo: 'Tomo' }[escolhas.pacto] ?? escolhas.pacto }] : []),
    ...(nivel >= 2
      ? [
          {
            nome: 'Invocações escolhidas',
            valor: Object.entries(escolhas)
              .filter(([k]) => k.startsWith('invocacao'))
              .map(([, v]) => v)
              .join(', ') || '—',
          },
        ]
      : []),
  ],
  subclasses: [
    {
      id: 'arquifada',
      nome: 'A Arquifada',
      pagina: 59,
      resumo: 'Um senhor ou senhora das fadas.',
      ferramentas: [],
      listaExpandida: expandida(['fogo das fadas', 'sono'], ['acalmar emoções', 'força fantasmagórica'], ['piscar', 'ampliar plantas'], ['dominar besta', 'invisibilidade maior'], ['dominar pessoa', 'similaridade']),
      recursos: () => [{ id: 'presenca-feerica', nome: 'Presença Feérica', maximo: 1, recarga: 'curto', detalhe: 'encanta ou amedronta em cubo de 3 m', pagina: 60 }],
      habilidades: [
        { nivel: 1, id: 'arquifada-presenca', nome: 'Presença Feérica', pagina: 60, resumo: 'Ação: criaturas num cubo de 3 m fazem resistência de Sab ou ficam enfeitiçadas ou amedrontadas até o fim do seu próximo turno. Uma vez por descanso.' },
        { nivel: 6, id: 'arquifada-nevoa', nome: 'Névoa de Fuga', pagina: 60, resumo: 'Reação ao sofrer dano: fica invisível e se teletransporta 18 m. Uma vez por descanso.' },
        { nivel: 10, id: 'arquifada-defesa', nome: 'Defesa Sedutora', pagina: 60, resumo: 'Imune a ser enfeitiçado; pode virar o encanto contra quem tentou.' },
        { nivel: 14, id: 'arquifada-delirio', nome: 'Delírio Sombrio', pagina: 60, resumo: 'Ação: uma criatura faz resistência de Sab ou fica enfeitiçada ou amedrontada num reino ilusório por 1 minuto.' },
      ],
    },
    {
      id: 'corruptor',
      nome: 'O Corruptor',
      pagina: 60,
      resumo: 'Um ser dos planos inferiores.',
      ferramentas: [],
      listaExpandida: expandida(['mãos flamejantes', 'comando'], ['cegueira/surdez', 'raio ardente'], ['bola de fogo', 'névoa fétida'], ['escudo de fogo', 'muralha de fogo'], ['coluna de chamas', 'consagrar']),
      extras: ({ nivel, mod }) => [{ nome: 'Bênção do Obscuro', valor: `${Math.max(1, mod.car + nivel)} PV temporários ao derrubar um hostil` }],
      habilidades: [
        { nivel: 1, id: 'corruptor-bencao', nome: 'Bênção do Obscuro', pagina: 60, resumo: 'Ao levar um hostil a 0 PV, ganha PV temporários iguais a Carisma + nível de bruxo.' },
        { nivel: 6, id: 'corruptor-sorte', nome: 'Sorte do Próprio Obscuro', pagina: 60, resumo: 'Soma 1d10 a um teste ou resistência. Uma vez por descanso.' },
        { nivel: 10, id: 'corruptor-resistencia', nome: 'Resistência Demoníaca', pagina: 60, resumo: 'Após um descanso, escolhe um tipo de dano para ter resistência.' },
        { nivel: 14, id: 'corruptor-inferno', nome: 'Lançar no Inferno', pagina: 60, resumo: 'Ao acertar, manda o alvo ao inferno até o fim do próximo turno; volta com 10d10 psíquico se não for corruptor.' },
      ],
    },
    {
      id: 'grande-antigo',
      nome: 'O Grande Antigo',
      pagina: 60,
      resumo: 'Uma entidade misteriosa e alienígena.',
      ferramentas: [],
      listaExpandida: expandida(['sussurros dissonantes', 'riso histérico de Tasha'], ['detectar pensamentos', 'força fantasmagórica'], ['clarividência', 'enviar mensagem'], ['dominar besta', 'tentáculos negros de Evard'], ['dominar pessoa', 'telecinésia']),
      habilidades: [
        { nivel: 1, id: 'antigo-mente', nome: 'Despertar a Mente', pagina: 61, resumo: 'Fala telepaticamente com qualquer criatura a 9 m.' },
        { nivel: 6, id: 'antigo-entropica', nome: 'Proteção Entrópica', pagina: 61, resumo: 'Reação: impõe desvantagem num ataque contra você; se errar, você tem vantagem no próximo ataque contra o atacante. Uma vez por descanso.' },
        { nivel: 10, id: 'antigo-escudo', nome: 'Escudo de Pensamentos', pagina: 61, resumo: 'Mente protegida contra leitura, resistência a dano psíquico e reflete o dano psíquico recebido.' },
        { nivel: 14, id: 'antigo-lacaio', nome: 'Criar Lacaio', pagina: 61, resumo: 'Toque num humanoide incapacitado: ele fica enfeitiçado por você até ser livrado.' },
      ],
    },
  ],
}
