import { escolhasEmSerie, escolhidosDaSerie } from './escolhas'
import type { EscolhaDeClasse, Classe } from '../tipos'
import { FERRAMENTAS_DE_ARTESAO, INSTRUMENTOS } from './ferramentas'

/** Dado de artes marciais (LdJ p. 103). */
export function dadoArtesMarciais(nivel: number): string {
  return nivel >= 17 ? '1d10' : nivel >= 11 ? '1d8' : nivel >= 5 ? '1d6' : '1d4'
}

/** Metros extras de Movimento sem Armadura (LdJ p. 103). */
export function movimentoSemArmadura(nivel: number): number {
  if (nivel < 2) return 0
  return nivel >= 18 ? 9 : nivel >= 14 ? 7.5 : nivel >= 10 ? 6 : nivel >= 6 ? 4.5 : 3
}

/**
 * Disciplinas Elementais (LdJ p. 107). Resumos em palavras próprias.
 * A partir do 5º nível, chi extra sobe o nível das magias (limite na ficha).
 */
export const DISCIPLINAS: EscolhaDeClasse['opcoes'] = [
  ['cavalgar-vento', 'Cavalgar o Vento', 11, '4 chi: voo em si mesmo.'],
  ['chamas-fenix', 'Chamas da Fênix', 11, '4 chi: bola de fogo.'],
  ['chicote-agua', 'Chicote de Água', 0, 'Ação, 2 chi: criatura a 9 m faz Des; falha sofre 3d10 de concussão (+1d10 por chi extra) e cai ou é puxada 7,5 m.'],
  ['defesa-montanha', 'Defesa Eterna da Montanha', 17, '5 chi: pele de pedra em si mesmo.'],
  ['varredura-cauterizante', 'Golpe de Varredura Cauterizante', 0, '2 chi: mãos flamejantes.'],
  ['gongo-pico', 'Gongo do Pico', 6, '3 chi: despedaçar.'],
  ['espiritos-ventania', 'Investida dos Espíritos da Ventania', 0, '2 chi: lufada de vento.'],
  ['moldar-rio', 'Moldar o Rio Corrente', 0, 'Ação, 1 chi: transforma e remodela água ou gelo numa área de até 9 m a até 36 m.'],
  ['onda-pedras', 'Onda de Pedras Rolantes', 17, '6 chi: muralha de pedra.'],
  ['postura-neblina', 'Postura da Neblina', 11, '4 chi: forma gasosa em si mesmo.'],
  ['presas-serpente', 'Presas da Serpente de Fogo', 0, '1 chi na ação de Ataque: ataques desarmados com +3 m de alcance e dano de fogo; +1 chi ao acertar soma 1d10 de fogo.'],
  ['punho-ar', 'Punho do Ar Contínuo', 0, 'Ação, 2 chi: criatura a 9 m faz For; falha sofre 3d10 de concussão (+1d10 por chi extra), é empurrada até 6 m e cai.'],
  ['quatro-trovoes', 'Punho dos Quatro Trovões', 0, '2 chi: onda trovejante.'],
  ['rio-chamas', 'Rio de Chamas Famintas', 17, '5 chi: muralha de fogo.'],
  ['vento-norte', 'Serragem do Vento do Norte', 6, '3 chi: imobilizar pessoa.'],
  ['sopro-inverno', 'Sopro do Inverno', 17, '6 chi: cone de frio.'],
].map(([id, nome, nivel, resumo]) => ({
  id: String(id),
  nome: String(nome),
  resumo: nivel ? `${resumo} Requer ${nivel}º nível.` : String(resumo),
  ...(nivel ? { nivelMinimo: Number(nivel) } : {}),
}))

/** Monge (LdJ p. 102–107). Resumos em palavras próprias. */
export const MONGE: Classe = {
  id: 'monge',
  nome: 'Monge',
  pagina: 102,
  dadoDeVida: 8,
  resistencias: ['for', 'des'],
  armaduras: [],
  armas: { categorias: ['simples'], especificas: ['espadaCurta'] },
  ferramentas: [],
  pericias: { quantidade: 2, opcoes: ['acrobacia', 'atletismo', 'furtividade', 'historia', 'intuicao', 'religiao'] },
  equipamentoFixo: [{ itemId: 'dardo', quantidade: 10 }],
  equipamentoEscolhas: [
    {
      id: 'arma',
      opcoes: [
        { rotulo: 'Espada curta', itens: [{ itemId: 'espadaCurta', quantidade: 1 }] },
        { rotulo: 'Qualquer arma simples', itens: [{ itemId: 'qualquer:simples', quantidade: 1 }] },
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
    {
      id: 'ferramenta',
      nivel: 1,
      rotulo: 'Ferramenta de artesão ou instrumento musical',
      pagina: 103,
      opcoes: [...FERRAMENTAS_DE_ARTESAO, ...INSTRUMENTOS].map((x) => ({ id: x.nome, nome: x.nome, resumo: 'Proficiência.' })),
    },
  ],
  habilidades: [
    { nivel: 1, id: 'monge-defesa', nome: 'Defesa sem Armadura', pagina: 104, resumo: 'Sem armadura e sem escudo, CA = 10 + Des + Sab.' },
    { nivel: 1, id: 'monge-artes', nome: 'Artes Marciais', pagina: 104, resumo: 'Desarmado ou com armas de monge (espada curta e armas simples corpo a corpo que não sejam de duas mãos nem pesadas): usa Des, o dado de artes marciais e ganha um ataque desarmado como ação bônus.' },
    { nivel: 2, id: 'monge-chi', nome: 'Chi', pagina: 104, resumo: 'Pontos de chi iguais ao nível; recuperam em descanso curto. Rajada de Golpes, Defesa Paciente e Passo do Vento custam 1 cada.' },
    { nivel: 2, id: 'monge-movimento', nome: 'Movimento sem Armadura', pagina: 104, resumo: 'Deslocamento extra sem armadura e sem escudo; no 9º nível, anda por paredes e sobre líquidos no seu turno.' },
    { nivel: 3, id: 'monge-tradicao', nome: 'Tradição Monástica', pagina: 104, resumo: 'Escolha da tradição (Mão Aberta, Sombra ou Quatro Elementos), com habilidades no 3º, 6º, 11º e 17º níveis.' },
    { nivel: 3, id: 'monge-defletir', nome: 'Defletir Projéteis', pagina: 104, resumo: 'Reação: reduz o dano de um ataque à distância em 1d10 + Des + nível; se zerar, pode gastar 1 chi para devolver o projétil.' },
    { nivel: 4, id: 'monge-queda', nome: 'Queda Lenta', pagina: 104, resumo: 'Reação: reduz o dano de queda em 5 × nível de monge.' },
    { nivel: 5, id: 'monge-ataque-extra', nome: 'Ataque Extra', pagina: 105, resumo: 'Dois ataques ao usar a ação de Ataque.' },
    { nivel: 5, id: 'monge-atordoante', nome: 'Ataque Atordoante', pagina: 105, resumo: 'Ao acertar corpo a corpo, gaste 1 chi: o alvo faz resistência de Con contra sua CD de chi ou fica atordoado até o fim do seu próximo turno.' },
    { nivel: 6, id: 'monge-golpes', nome: 'Golpes de Chi', pagina: 105, resumo: 'Ataques desarmados contam como mágicos.' },
    { nivel: 7, id: 'monge-evasao', nome: 'Evasão', pagina: 105, resumo: 'Em efeitos com resistência de Destreza para meio dano: sucesso = nenhum dano, falha = metade.' },
    { nivel: 7, id: 'monge-mente', nome: 'Mente Tranquila', pagina: 105, resumo: 'Ação: encerra um efeito que o deixa enfeitiçado ou amedrontado.' },
    { nivel: 10, id: 'monge-pureza', nome: 'Pureza Corporal', pagina: 105, resumo: 'Imune a doenças e veneno.' },
    { nivel: 13, id: 'monge-idiomas', nome: 'Idiomas do Sol e da Lua', pagina: 105, resumo: 'Entende todos os idiomas falados e é entendido por quem fala algum idioma.' },
    { nivel: 14, id: 'monge-diamante', nome: 'Alma de Diamante', pagina: 105, resumo: 'Proficiência em todas as resistências; gaste 1 chi para rolar de novo uma resistência que falhou.' },
    { nivel: 15, id: 'monge-atemporal', nome: 'Corpo Atemporal', pagina: 105, resumo: 'Não sofre fraquezas da idade nem envelhece por magia; não precisa de comida nem água.' },
    { nivel: 18, id: 'monge-vazio', nome: 'Corpo Vazio', pagina: 105, resumo: '4 chi: invisível por 1 minuto com resistência a todo dano exceto energia. 8 chi: projeção astral.' },
    { nivel: 20, id: 'monge-aperfeicoamento', nome: 'Auto Aperfeiçoamento', pagina: 105, resumo: 'Ao rolar iniciativa sem chi, recupera 4 pontos.' },
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 3,
  nomeSubclasse: 'Tradição Monástica',
  resistenciasPorNivel: [
    { nivel: 14, atributo: 'con' },
    { nivel: 14, atributo: 'int' },
    { nivel: 14, atributo: 'sab' },
    { nivel: 14, atributo: 'car' },
  ],
  defesaSemArmadura: { atributo: 'sab', permiteEscudo: false },
  deslocamentoExtra: (nivel) => ({ metros: movimentoSemArmadura(nivel), semArmadura: 'nenhuma' }),
  ataquesPorAcao: (nivel) => (nivel >= 5 ? 2 : 1),
  artesMarciais: dadoArtesMarciais,
  recursos: ({ nivel }) =>
    nivel >= 2 ? [{ id: 'chi', nome: 'Pontos de chi', maximo: nivel, recarga: 'curto', detalhe: 'Rajada, Defesa Paciente, Passo do Vento: 1 cada', pagina: 104 }] : [],
  extras: ({ nivel, proficiencia, mod }) => [
    { nome: 'Artes marciais', valor: dadoArtesMarciais(nivel) },
    ...(nivel >= 2 ? [{ nome: 'CD do chi', valor: String(8 + proficiencia + mod.sab) }] : []),
  ],
  subclasses: [
    {
      id: 'mao-aberta',
      nome: 'Caminho da Mão Aberta',
      pagina: 105,
      resumo: 'Mestres do combate desarmado que manipulam o chi do oponente.',
      ferramentas: [],
      recursos: ({ nivel }) =>
        nivel >= 6 ? [{ id: 'integridade', nome: 'Integridade Corporal', maximo: 1, recarga: 'longo', detalhe: 'cura 3 × nível de monge', pagina: 105 }] : [],
      habilidades: [
        { nivel: 3, id: 'mao-tecnica', nome: 'Técnica da Mão Aberta', pagina: 105, resumo: 'Ao acertar com a Rajada de Golpes: derrubar (resistência de Des), empurrar 4,5 m (For) ou impedir reações.' },
        { nivel: 6, id: 'mao-integridade', nome: 'Integridade Corporal', pagina: 105, resumo: 'Ação: recupera PV iguais a três vezes o nível de monge. Uma vez por descanso longo.' },
        { nivel: 11, id: 'mao-tranquilidade', nome: 'Tranquilidade', pagina: 106, resumo: 'Ao fim de um descanso longo, ganha o efeito de santuário até o próximo descanso longo (CD 8 + Sab + prof.).' },
        { nivel: 17, id: 'mao-palma', nome: 'Palma Vibrante', pagina: 106, resumo: '3 chi ao acertar desarmado: vibrações letais que, quando ativadas, exigem resistência de Con; se falhar, o alvo cai a 0 PV, senão sofre 10d10 necrótico.' },
      ],
    },
    {
      id: 'sombra',
      nome: 'Caminho da Sombra',
      pagina: 106,
      resumo: 'Furtividade e subterfúgio: ninjas e dançarinos das sombras.',
      ferramentas: [],
      habilidades: [
        { nivel: 3, id: 'sombra-artes', nome: 'Artes Sombrias', pagina: 106, resumo: '2 chi para conjurar escuridão, visão no escuro, passos sem pegadas ou silêncio; conhece o truque ilusão menor.' },
        { nivel: 6, id: 'sombra-passo', nome: 'Passo das Sombras', pagina: 106, resumo: 'Na penumbra ou escuridão, ação bônus para se teletransportar até 18 m para outra sombra, com vantagem no próximo ataque corpo a corpo.' },
        { nivel: 11, id: 'sombra-manto', nome: 'Manto de Sombras', pagina: 106, resumo: 'Na penumbra ou escuridão, fica invisível com uma ação até atacar, conjurar ou chegar à luz.' },
        { nivel: 17, id: 'sombra-oportunista', nome: 'Oportunista', pagina: 106, resumo: 'Reação: ataca corpo a corpo uma criatura a 1,5 m que foi atingida por outra criatura.' },
      ],
    },
    {
      id: 'quatro-elementos',
      nome: 'Caminho dos Quatro Elementos',
      pagina: 106,
      resumo: 'Canaliza o chi em disciplinas elementais.',
      ferramentas: [],
      escolhas: escolhasEmSerie('disciplina', 'Disciplina Elemental', 107, [3, 6, 11, 17], DISCIPLINAS),
      // Ao aprender uma disciplina nova, pode trocar uma que já conhecia (LdJ p. 106).
      trocas: [{ prefixo: 'disciplina', nome: 'disciplina elemental', pagina: 106, niveis: [6, 11, 17] }],
      extras: ({ nivel, escolhas }) => [
        {
          nome: `Disciplinas (${nivel >= 17 ? 5 : nivel >= 11 ? 4 : nivel >= 6 ? 3 : 2})`,
          valor: `Sintonia Elemental, ${escolhidosDaSerie('disciplina', escolhas, DISCIPLINAS)}`,
        },
        { nome: 'Chi máximo por disciplina', valor: String(nivel >= 17 ? 6 : nivel >= 13 ? 5 : nivel >= 9 ? 4 : nivel >= 5 ? 3 : 2) },
      ],
      habilidades: [
        { nivel: 3, id: 'elementos-sintonia', nome: 'Sintonia Elemental', pagina: 107, resumo: 'Ação: pequeno efeito elemental inofensivo, acender ou apagar uma chama, esquentar ou esfriar meio quilo de material, ou moldar um pouco de terra, fogo, ar ou névoa por 1 minuto.' },
        { nivel: 3, id: 'elementos-discipulo', nome: 'Discípulo dos Elementos', pagina: 106, resumo: 'Aprende Sintonia Elemental e mais uma disciplina; outras no 6º, 11º e 17º níveis. Disciplinas usam a CD do chi.' },
      ],
    },
  ],
}
