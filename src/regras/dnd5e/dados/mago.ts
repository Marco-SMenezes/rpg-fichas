import type { Classe, HabilidadeDeClasse, Subclasse } from '../tipos'

const h = (nivel: number, id: string, nome: string, pagina: number, resumo: string): HabilidadeDeClasse => ({ nivel, id, nome, pagina, resumo })

const escola = (id: string, nome: string, pagina: number, resumo: string, habilidades: HabilidadeDeClasse[], extra: Partial<Subclasse> = {}): Subclasse => ({
  id,
  nome,
  pagina,
  resumo,
  ferramentas: [],
  habilidades,
  ...extra,
})

/** Mago (LdJ p. 94–101). Resumos em palavras próprias. */
export const MAGO: Classe = {
  id: 'mago',
  nome: 'Mago',
  pagina: 94,
  dadoDeVida: 6,
  resistencias: ['int', 'sab'],
  armaduras: [],
  armas: { categorias: [], especificas: ['adaga', 'dardo', 'funda', 'bordao', 'bestaLeve'] },
  ferramentas: [],
  pericias: { quantidade: 2, opcoes: ['arcanismo', 'historia', 'intuicao', 'investigacao', 'medicina', 'religiao'] },
  equipamentoFixo: [{ itemId: 'grimorio', quantidade: 1 }],
  equipamentoEscolhas: [
    {
      id: 'arma',
      opcoes: [
        { rotulo: 'Bordão', itens: [{ itemId: 'bordao', quantidade: 1 }] },
        { rotulo: 'Adaga', itens: [{ itemId: 'adaga', quantidade: 1 }] },
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
  ],
  habilidades: [
    h(1, 'mago-conjuracao', 'Conjuração', 96, 'Grimório com seis magias de 1º nível e mais duas a cada nível; prepara Inteligência + nível delas após descanso longo e conjura rituais do grimório sem preparar. CD = 8 + prof. + Int.'),
    h(1, 'mago-recuperacao', 'Recuperação Arcana', 97, 'Uma vez por dia, num descanso curto, recupera espaços que somem até metade do nível de mago (para cima), nenhum de 6º ou mais.'),
    h(2, 'mago-tradicao', 'Tradição Arcana', 97, 'Escolha da escola de magia, com habilidades no 2º, 6º, 10º e 14º níveis.'),
    h(18, 'mago-dominar', 'Dominar Magia', 97, 'Uma magia de 1º e uma de 2º nível do grimório viram de uso livre, sem gastar espaço.'),
    h(20, 'mago-assinatura', 'Magias Assinatura', 97, 'Duas magias de 3º nível sempre preparadas, cada uma conjurável uma vez por descanso sem gastar espaço.'),
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 2,
  nomeSubclasse: 'Tradição Arcana',
  conjuracao: { tipo: 'completo', atributo: 'int' },
  magias: {
    truques: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    preparadas: ({ nivel, mod }) => Math.max(1, mod.int + nivel),
  },
  recursos: ({ nivel }) => [
    { id: 'recuperacao-arcana', nome: 'Recuperação Arcana', maximo: 1, recarga: 'longo', detalhe: `espaços somando até ${Math.ceil(nivel / 2)} níveis`, pagina: 97 },
  ],
  extras: ({ nivel }) => [{ nome: 'Magias no grimório (mínimo)', valor: String(6 + 2 * (nivel - 1)) }],
  subclasses: [
    escola('abjuracao', 'Escola de Abjuração', 97, 'Magia de proteção e banimento.', [
      h(2, 'abj-instruida', 'Abjuração Instruída', 97, 'Copia magias de abjuração pela metade do tempo e do custo.'),
      h(2, 'abj-protecao', 'Proteção Arcana', 97, 'Ao conjurar abjuração de 1º nível ou mais, cria uma proteção com 2 × nível + Int PV que absorve dano; recarrega com novas abjurações.'),
      h(6, 'abj-projetada', 'Proteção Projetada', 97, 'Reação: a Proteção Arcana absorve dano de uma criatura a 9 m.'),
      h(10, 'abj-aprimorada', 'Abjuração Aprimorada', 97, 'Soma a proficiência nos testes de atributo de magias de abjuração (como contramágica).'),
      h(14, 'abj-resistencia', 'Resistência à Magia', 98, 'Vantagem em resistências contra magia e resistência a dano de magias.'),
    ]),
    escola('adivinhacao', 'Escola de Adivinhação', 98, 'Ver o futuro e desvendar segredos.', [
      h(2, 'adiv-instruida', 'Adivinhação Instruída', 98, 'Copia magias de adivinhação pela metade do tempo e do custo.'),
      h(2, 'adiv-prodigio', 'Prodígio', 98, 'Após descanso longo, rola 2d20 e guarda os resultados para substituir qualquer d20 seu ou de outros (3 dados no 14º).'),
      h(6, 'adiv-especialista', 'Especialista em Adivinhação', 98, 'Ao conjurar adivinhação de 2º nível ou mais, recupera um espaço de nível menor.'),
      h(10, 'adiv-terceiro-olho', 'O Terceiro Olho', 98, 'Ação: ganha visão no escuro, visão etérea, ler idiomas ou ver invisível até um descanso.'),
      h(14, 'adiv-maior', 'Prodígio Maior', 98, 'Rola três d20 no Prodígio.'),
    ], {
      recursos: ({ nivel }) => [{ id: 'prodigio', nome: 'Prodígio (d20 guardados)', maximo: nivel >= 14 ? 3 : 2, recarga: 'longo', detalhe: 'substitui um d20', pagina: 98 }],
    }),
    escola('conjuracao', 'Escola de Conjuração', 98, 'Criar objetos e criaturas e teletransportar.', [
      h(2, 'conj-instruida', 'Conjuração Instruída', 98, 'Copia magias de conjuração pela metade do tempo e do custo.'),
      h(2, 'conj-menor', 'Conjuração Menor', 98, 'Cria um objeto não mágico de até 1 kg por 1 hora.'),
      h(6, 'conj-transposicao', 'Transposição Benigna', 99, 'Teletransporta-se até 9 m ou troca de lugar com uma criatura voluntária. Uma vez por descanso longo ou ao conjurar conjuração.'),
      h(10, 'conj-focada', 'Conjuração Focada', 99, 'Dano não quebra sua concentração em magias de conjuração.'),
      h(14, 'conj-resistentes', 'Invocações Resistentes', 99, 'Criaturas que você invoca têm 30 PV temporários.'),
    ]),
    escola('encantamento', 'Escola de Encantamento', 99, 'Influenciar mentes.', [
      h(2, 'enc-instruido', 'Encantamento Instruído', 99, 'Copia magias de encantamento pela metade do tempo e do custo.'),
      h(2, 'enc-olhar', 'Olhar Hipnotizante', 99, 'Ação: criatura a 1,5 m faz resistência de Sab ou fica enfeitiçada e incapacitada enquanto você mantiver.'),
      h(6, 'enc-instintivo', 'Encanto Instintivo', 99, 'Reação: desvia o ataque de uma criatura para outra (Sab evita).'),
      h(10, 'enc-dividir', 'Dividir Encantamento', 99, 'Encantamentos de um alvo podem afetar dois.'),
      h(14, 'enc-memorias', 'Alterar Memórias', 99, 'O alvo encantado não percebe que foi encantado e pode esquecer horas.'),
    ]),
    escola('evocacao', 'Escola de Evocação', 99, 'Energia destrutiva.', [
      h(2, 'evo-instruida', 'Evocação Instruída', 99, 'Copia magias de evocação pela metade do tempo e do custo.'),
      h(2, 'evo-esculpir', 'Esculpir Magias', 99, 'Escolhe até 1 + nível da magia criaturas para passar automaticamente e não sofrer dano na sua evocação.'),
      h(6, 'evo-truque', 'Truque Potente', 99, 'Truques com resistência causam metade do dano mesmo em sucesso.'),
      h(10, 'evo-potencializada', 'Evocação Potencializada', 100, 'Soma Inteligência no dano de uma rolagem das suas evocações.'),
      h(14, 'evo-sobrecarga', 'Sobrecarga', 100, 'Causa o dano máximo numa magia de 5º nível ou menos; repetir causa dano necrótico em você.'),
    ]),
    escola('ilusao', 'Escola de Ilusão', 100, 'Enganar os sentidos.', [
      h(2, 'ilu-instruida', 'Ilusão Instruída', 100, 'Copia magias de ilusão pela metade do tempo e do custo.'),
      h(2, 'ilu-menor', 'Ilusão Menor Aprimorada', 100, 'Conhece ilusão menor e cria som e imagem ao mesmo tempo.'),
      h(6, 'ilu-moldavel', 'Ilusões Moldáveis', 100, 'Altera ilusões de 1 minuto ou mais com uma ação.'),
      h(10, 'ilu-eu', 'Eu Ilusório', 100, 'Reação: um ataque contra você erra automaticamente. Uma vez por descanso.'),
      h(14, 'ilu-realidade', 'Realidade Ilusória', 100, 'Torna real por 1 minuto um objeto inanimado da sua ilusão.'),
    ]),
    escola('necromancia', 'Escola de Necromancia', 100, 'Vida, morte e mortos-vivos.', [
      h(2, 'nec-instruida', 'Necromancia Instruída', 100, 'Copia magias de necromancia pela metade do tempo e do custo.'),
      h(2, 'nec-colheita', 'Colheita Sinistra', 100, 'Ao matar com magia, cura 2 × nível da magia (3 × se for necromancia).'),
      h(6, 'nec-escravos', 'Escravos Mortos-Vivos', 101, 'Animar mortos cria um morto-vivo a mais, e eles ganham PV e dano extras.'),
      h(10, 'nec-acostumado', 'Acostumado à Morte-Vida', 101, 'Resistência a dano necrótico e o PV máximo não é reduzido.'),
      h(14, 'nec-comandar', 'Comandar Mortos-Vivos', 101, 'Toma controle de um morto-vivo (Car evita).'),
    ]),
    escola('transmutacao', 'Escola de Transmutação', 101, 'Mudar a matéria e a forma.', [
      h(2, 'tra-instruida', 'Transmutação Instruída', 101, 'Copia magias de transmutação pela metade do tempo e do custo.'),
      h(2, 'tra-alquimia', 'Alquimia Menor', 101, 'Transforma um material em outro temporariamente.'),
      h(6, 'tra-pedra', 'Pedra de Transmutador', 101, 'Cria uma pedra que dá visão no escuro, +3 m, proficiência em Con ou resistência a um tipo de dano.'),
      h(10, 'tra-metamorfo', 'Metamorfo', 101, 'Conjura metamorfose em si mesmo sem gastar espaço, uma vez por descanso.'),
      h(14, 'tra-mestre', 'Mestre Transmutador', 101, 'Destrói a pedra para transformar objetos, curar, rejuvenescer ou reviver.'),
    ]),
  ],
}
