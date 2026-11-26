/** Tipos do sistema D&D 5e (Livro do Jogador, 2014). */

export type Atributo = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car'

export type PericiaId =
  | 'acrobacia'
  | 'adestrarAnimais'
  | 'arcanismo'
  | 'atletismo'
  | 'atuacao'
  | 'enganacao'
  | 'furtividade'
  | 'historia'
  | 'intimidacao'
  | 'intuicao'
  | 'investigacao'
  | 'medicina'
  | 'natureza'
  | 'percepcao'
  | 'persuasao'
  | 'prestidigitacao'
  | 'religiao'
  | 'sobrevivencia'

export type ValoresAtributos = Record<Atributo, number>

/** Página do Livro do Jogador. `null` quando ainda não foi conferida. */
export type Pagina = number | null

/** Texto curto em palavras próprias + página do livro. Nunca o texto original. */
export interface Habilidade {
  id: string
  nome: string
  resumo: string
  pagina: Pagina
}

export type EscolaDeMagia =
  | 'abjuração'
  | 'adivinhação'
  | 'conjuração'
  | 'encantamento'
  | 'evocação'
  | 'ilusão'
  | 'necromancia'
  | 'transmutação'

export interface Magia {
  id: string
  nome: string
  /** 0 = truque. */
  nivel: number
  escola: string
  ritual: boolean
  concentracao: boolean
  tempo: string
  alcance: string
  componentes: string
  duracao: string
  /** Ids das classes que têm a magia na lista. */
  classes: string[]
  pagina: number
  resumo: string
}

export type CategoriaArmadura = 'leve' | 'media' | 'pesada' | 'escudo'
export type CategoriaArma = 'simples' | 'marcial'

export interface Arma {
  tipo: 'arma'
  id: string
  nome: string
  categoria: CategoriaArma
  alcance: 'corpo' | 'distancia'
  dano: string
  tipoDano: 'perfurante' | 'cortante' | 'concussao'
  peso: number
  precoPo: number
  propriedades: PropriedadeArma[]
  /** Dano usando duas mãos (propriedade versátil). */
  versatil?: string
  /** Distância normal/longa em metros. */
  distancia?: [number, number]
}

export type PropriedadeArma =
  | 'acuidade'
  | 'leve'
  | 'arremesso'
  | 'municao'
  | 'duasMaos'
  | 'pesada'
  | 'alcance'
  | 'recarga'
  | 'versatil'

export interface Armadura {
  tipo: 'armadura'
  id: string
  nome: string
  categoria: CategoriaArmadura
  caBase: number
  /** Limite do modificador de Destreza: null = sem limite, 0 = não soma. */
  limiteDes: number | null
  forcaMinima: number | null
  desvantagemFurtividade: boolean
  peso: number
  precoPo: number
}

export interface ItemComum {
  tipo: 'item'
  id: string
  nome: string
  peso: number
  precoPo: number
}

export type ItemCatalogo = Arma | Armadura | ItemComum

/** Mecânicas que tanto a raça quanto a sub-raça podem dar. */
export interface TracosMecanicos {
  aumentos: Partial<ValoresAtributos>
  /** +1 em N atributos à escolha (meio-elfo), fora os listados em `excluir`. */
  aumentosEscolha?: { quantidade: number; excluir: Atributo[] }
  pericias: PericiaId[]
  /** Perícias livres à escolha (meio-elfo). */
  periciasEscolha?: number
  armas: string[]
  armaduras?: CategoriaArmadura[]
  ferramentas?: string[]
  escolhaFerramenta?: { rotulo: string; opcoes: string[] }
  idiomasExtras?: number
  /** PV extras por nível de personagem (anão da colina). */
  pvPorNivel?: number
  resistenciasDano?: string[]
  /** Alcance da visão no escuro em metros. */
  visaoNoEscuro?: number
  tracos: Habilidade[]
}

export interface Raca extends TracosMecanicos {
  id: string
  nome: string
  pagina: Pagina
  tamanho: 'Pequeno' | 'Médio'
  deslocamento: number
  /** Armadura pesada não reduz o deslocamento (anão). */
  ignoraForcaArmadura?: boolean
  idiomas: string[]
  /** Escolha que muda mecânicas (ancestral dracônico). */
  ancestrais?: AncestralDraconico[]
  /** Ganha um talento no 1º nível (humano variante). */
  talento?: boolean
  subracas: Subraca[]
}

export interface Subraca extends TracosMecanicos {
  id: string
  nome: string
  pagina: Pagina
  deslocamento?: number
}

export interface AncestralDraconico {
  id: string
  nome: string
  dano: string
  area: string
  teste: Atributo
}

export interface HabilidadeDeClasse extends Habilidade {
  nivel: number
}

export interface OpcaoEquipamento {
  rotulo: string
  /** itemId pode ser um coringa: 'qualquer:simples', 'qualquer:marcial', 'qualquer:marcial-corpo', 'qualquer:simples-corpo'. */
  itens: { itemId: string; quantidade: number }[]
}

export interface EscolhaEquipamento {
  id: string
  opcoes: OpcaoEquipamento[]
}

export type TipoConjurador = 'completo' | 'meio' | 'terco' | 'pacto'

/** Contexto que as regras de uma classe usam para calcular recursos e bônus. */
/** O mínimo para regras que só dependem do nível e das escolhas. */
export type ContextoEscolhas = Pick<ContextoClasse, 'nivel' | 'escolhas'>

export interface ContextoClasse {
  nivel: number
  proficiencia: number
  mod: Record<Atributo, number>
  escolhas: Record<string, string>
}

/** Recurso que se gasta e volta no descanso (fúria, chi, surto de ação…). */
export interface Recurso {
  id: string
  nome: string
  /** null = ilimitado. */
  maximo: number | null
  recarga: 'curto' | 'longo'
  detalhe: string
  pagina: Pagina
}

/** Escolha feita ao ganhar um nível (estilo de luta, totem…). */
export interface OpcaoDeEscolha {
  id: string
  nome: string
  resumo: string
  /** Nível de classe exigido (disciplinas, invocações). */
  nivelMinimo?: number
  /** Outra escolha exigida, feita no `nivel` indicado (ex.: Pacto da Lâmina no 3º). */
  exigeEscolha?: { id: string; valor: string; nivel: number; nome: string }
  /** Magia que precisa conhecer (ex.: rajada mística); vira aviso na ficha. */
  exigeMagia?: string
}

export interface EscolhaDeClasse {
  id: string
  nivel: number
  rotulo: string
  /** `nivelMinimo`: nível de classe exigido para pegar a opção (disciplinas do monge). */
  opcoes: OpcaoDeEscolha[]
  pagina: Pagina
}

export type EstiloDeLuta = 'arquearia' | 'defesa' | 'duelismo' | 'armasGrandes' | 'protecao' | 'duasArmas'

/** Regras de classe ou subclasse que mexem nas contas da ficha. */
export interface RegrasDeClasse {
  recursos?: (c: ContextoClasse) => Recurso[]
  escolhas?: EscolhaDeClasse[]
  /** Defesa sem armadura: base (10) + Des + atributo (se houver). */
  defesaSemArmadura?: { atributo?: Atributo; base?: number; permiteEscudo: boolean }
  /** Proficiências extras da subclasse (domínios, colégios…). */
  armaduras?: CategoriaArmadura[]
  armasCategorias?: CategoriaArma[]
  /** PV extras por nível de classe (Resiliência Dracônica). */
  pvPorNivel?: number
  /** Metade da proficiência (para baixo) em testes de habilidade sem proficiência (Versatilidade do bardo). */
  meiaProficiencia?: (nivel: number) => boolean
  /** Truques, magias conhecidas ou preparadas (também em subclasses conjuradoras). */
  magias?: {
    preparadas?: (c: ContextoClasse) => number
    conhecidas?: number[]
    truques?: number[]
    /** Nível de magia que pode escolher além dos espaços (Arcana Mística do bruxo). */
    nivelMaximoExtra?: (nivel: number) => number
  }
  /** Metros extras de deslocamento sem armadura (ou sem armadura pesada). */
  deslocamentoExtra?: (nivel: number) => { metros: number; semArmadura: 'nenhuma' | 'pesada' }
  /** Ataques por ação de Ataque. */
  ataquesPorAcao?: (nivel: number) => number
  /** Ataque desarmado com dado próprio (monge). */
  artesMarciais?: (nivel: number) => string
  /** Menor resultado do d20 que é crítico (Campeão: 19, depois 18). */
  margemCritico?: (nivel: number) => number
  /** Somado às resistências (Aura de Proteção do paladino). */
  bonusResistencias?: (c: ContextoClasse) => number
  /** Aumento de atributo próprio da classe (Campeão Primitivo). */
  aumentosDeClasse?: (nivel: number) => { aumentos: Partial<ValoresAtributos>; maximo: number } | null
  /** Proficiência em resistências ganha em certo nível (Mente de Aço). */
  resistenciasExtras?: { nivel: number; atributo: Atributo }[]
  /** Magias sempre preparadas por nível de classe (domínio, juramento…), por id. Não contam no limite. */
  magiasSempre?: Record<number, string[]>
  /** Magias sempre preparadas que dependem de uma escolha (terreno do druida). */
  magiasPorEscolha?: { escolha: string; porOpcao: Record<string, Record<number, string[]>> }
  /** Magias extras que entram na lista da classe, por nível de magia (patrono do bruxo). */
  listaExpandida?: Record<number, string[]>
  /**
   * Segredos Mágicos (bardo): quantas magias podem vir da lista de qualquer classe
   * e quantas dessas são além do limite de magias conhecidas.
   */
  segredosMagicos?: (nivel: number) => { total: number; alemDoLimite: number }
  /**
   * Níveis em que dá para trocar uma opção já escolhida de uma série
   * (manobra, disciplina, invocação) por outra da mesma lista.
   */
  trocas?: { prefixo: string; nome: string; pagina: Pagina; niveis: number[] }[]
  /** Perícias, especializações e idiomas que vêm de escolhas (subclasses, invocações). */
  periciasExtras?: (c: ContextoEscolhas) => PericiaId[]
  especializacoesExtras?: (c: ContextoEscolhas) => PericiaId[]
  idiomasExtras?: (c: ContextoEscolhas) => string[]
  /** Valores extras para mostrar na ficha (dano de fúria, CD do chi…). */
  extras?: (c: ContextoClasse) => { nome: string; valor: string }[]
}

export interface Subclasse extends RegrasDeClasse {
  id: string
  nome: string
  pagina: Pagina
  resumo: string
  ferramentas: string[]
  habilidades: HabilidadeDeClasse[]
  conjuracao?: { tipo: TipoConjurador; atributo: Atributo }
}

export interface Classe extends RegrasDeClasse {
  id: string
  nome: string
  pagina: Pagina
  dadoDeVida: number
  resistencias: Atributo[]
  armaduras: CategoriaArmadura[]
  armas: { categorias: CategoriaArma[]; especificas: string[] }
  ferramentas: string[]
  pericias: { quantidade: number; opcoes: PericiaId[] }
  equipamentoFixo: { itemId: string; quantidade: number }[]
  equipamentoEscolhas: EscolhaEquipamento[]
  habilidades: HabilidadeDeClasse[]
  niveisIncremento: number[]
  nivelSubclasse: number
  nomeSubclasse: string
  subclasses: Subclasse[]
  /** Níveis em que a classe ganha Especialização e quantas escolhas. */
  especializacao?: { nivel: number; quantidade: number }[]
  /** Proficiências ganhas em níveis altos (ex.: Mente Escorregadia). */
  resistenciasPorNivel?: { nivel: number; atributo: Atributo }[]
  conjuracao?: { tipo: TipoConjurador; atributo: Atributo }
}

export interface Antecedente {
  id: string
  nome: string
  pagina: Pagina
  pericias: PericiaId[]
  ferramentas: string[]
  /** Ferramenta à escolha do jogador (ex.: "um tipo de kit de jogo"). */
  escolhaFerramenta?: { rotulo: string; opcoes: string[]; /** a ferramenta escolhida também vem no equipamento */ noEquipamento?: boolean }
  idiomasExtras: number
  equipamento: { itemId: string; quantidade: number }[]
  /** Itens sem entrada no catálogo (peso em kg). */
  equipamentoLivre?: { nome: string; quantidade: number; peso: number }[]
  moedasPo: number
  caracteristica: Habilidade
}

/* ---------- Personagem salvo (só escolhas e estado, nada calculado) ---------- */

export type Especializavel = PericiaId | 'ferramentasDeLadrao'

export interface ItemInventario {
  uid: string
  itemId: string | null
  nome: string
  quantidade: number
  /** Peso unitário em kg. */
  peso: number
  equipado: boolean
  notas: string
}

export interface Incremento {
  nivel: number
  /** Com talento, guarda o +1 do talento (se houver) para a conta de atributos. */
  aumentos: Partial<ValoresAtributos>
  /** Talento no lugar do incremento (regra opcional, LdJ p. 167). */
  talento?: TalentoEscolhido
}

/** Talento escolhido e as escolhas dele (atributo, perícias, magias…). */
export interface TalentoEscolhido {
  id: string
  escolhas: Record<string, string>
}

/** O que um talento muda nas contas da ficha. */
export interface EfeitosDeTalento {
  aumentos?: Partial<ValoresAtributos>
  iniciativa?: number
  pvPorNivel?: number
  deslocamento?: number
  /** Soma na Percepção passiva (e Investigação passiva). */
  passivas?: number
  resistencias?: Atributo[]
  pericias?: PericiaId[]
  idiomas?: string[]
  armaduras?: CategoriaArmadura[]
  /** Ids de armas com proficiência. */
  armas?: string[]
  /** Destreza máxima na CA com armadura média (Maestria em Armadura Média). */
  desMaxArmaduraMedia?: number
  recursos?: Recurso[]
  /** Escolhas para mostrar na ficha ("Truques: Luz, Mãos Mágicas"). */
  detalhes?: string[]
}

export interface EscolhaDeTalento {
  id: string
  rotulo: string
  /** As opções podem depender de outra escolha do talento (ex.: lista de magias). */
  opcoes: (escolhas: Record<string, string>) => OpcaoDeEscolha[]
}

export interface Talento {
  id: string
  nome: string
  pagina: Pagina
  resumo: string
  requisito?: {
    texto: string
    /** Basta um destes atributos com o mínimo. */
    atributos?: Atributo[]
    minimo?: number
    conjurador?: boolean
    armadura?: CategoriaArmadura
  }
  repetivel?: boolean
  escolhas?: EscolhaDeTalento[]
  efeitos?: (escolhas: Record<string, string>) => EfeitosDeTalento
}

export interface EstadoDeJogo {
  pvAtual: number
  pvTemporario: number
  dadosDeVidaGastos: number
  inspiracao: boolean
  /** Usos gastos de cada recurso de classe, por id. */
  recursosGastos: Record<string, number>
  /** Espaços gastos por nível de magia (índice 0 = 1º nível). */
  espacosGastos: number[]
  /** Testes de resistência contra a morte (LdJ p. 199). */
  morte: { sucessos: number; falhas: number }
  /** Condições ativas, por id (LdJ p. 291). */
  condicoes?: string[]
  /** Nível de exaustão, de 0 a 6 (LdJ p. 292). */
  exaustao?: number
  /** Magia em que está se concentrando (id), ou texto livre. */
  concentracao?: string | null
}

export interface EscolhasRaciais {
  aumentos: Atributo[]
  pericias: PericiaId[]
  ferramenta: string
  ancestral: string
  /** Talento do humano variante. */
  talento?: TalentoEscolhido | null
}

/** Detalhes do personagem (LdJ p. 123–126), todos texto livre. */
export interface Historia {
  idade: string
  genero: string
  altura: string
  peso: string
  olhos: string
  cabelo: string
  pele: string
  aparencia: string
  tendencia: string
  objetivo: string
  passado: string
}

export interface Personalidade {
  tracos: string
  ideais: string
  vinculos: string
  defeitos: string
}

/**
 * Layout da ficha por tela ('estreita' = celular, 'larga' = computador).
 * As chaves 'personalizada:…' guardam a aba Personalizada (o que aparece nela e em que ordem).
 */
export type LayoutsSalvos = Partial<Record<'estreita' | 'larga' | 'personalizada:estreita' | 'personalizada:larga', unknown>>

export interface Personagem {
  versao: 1
  sistema: 'dnd5e'
  id: string
  nome: string
  conceito: string
  jogador: string
  criadoEm: string
  atualizadoEm: string
  racaId: string
  subracaId: string | null
  classeId: string
  subclasseId: string | null
  antecedenteId: string
  nivel: number
  metodoAtributos: 'compra' | 'padrao' | 'rolagem' | 'manual'
  atributosBase: ValoresAtributos
  incrementos: Incremento[]
  /** Escolhas da raça: atributos (+1 cada), perícias, ferramenta e ancestral. */
  escolhasRaciais: EscolhasRaciais
  /** Magias do personagem: conhecidas ou no grimório, com a marcação de preparada. */
  magias: { id: string; preparada: boolean }[]
  /** Escolhas de classe e subclasse por id (estilo de luta, totem…). */
  escolhasDeClasse: Record<string, string>
  /** Perícias escolhidas na classe (e substitutas por sobreposição). */
  periciasEscolhidas: PericiaId[]
  especializacoes: Especializavel[]
  ferramentasEscolhidas: string[]
  idiomasEscolhidos: string[]
  /** PV ganhos (só o dado, sem Con) em cada nível a partir do 2º. */
  pvPorNivel: number[]
  estado: EstadoDeJogo
  /** Foto do personagem (JPEG reduzido em data URL). Opcional. */
  retrato?: string
  /**
   * Organização da ficha (ordem, largura e blocos escondidos) por tipo de tela.
   * O formato é do módulo de layout da interface; aqui fica opaco.
   */
  layout?: LayoutsSalvos
  inventario: ItemInventario[]
  moedas: { pc: number; pp: number; pe: number; po: number; pl: number }
  historia: Historia
  personalidade: Personalidade
  anotacoes: string
  /** Texto completo que o próprio usuário digitou para cada habilidade. */
  anotacoesHabilidades: Record<string, string>
}
