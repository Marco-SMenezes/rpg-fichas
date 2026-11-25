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
  itens: { itemId: string; quantidade: number }[]
}

export interface EscolhaEquipamento {
  id: string
  opcoes: OpcaoEquipamento[]
}

export type TipoConjurador = 'completo' | 'meio' | 'terco'

export interface Subclasse {
  id: string
  nome: string
  pagina: Pagina
  resumo: string
  ferramentas: string[]
  habilidades: HabilidadeDeClasse[]
  conjuracao?: { tipo: TipoConjurador; atributo: Atributo }
}

export interface Classe {
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
  escolhaFerramenta?: { rotulo: string; opcoes: string[] }
  idiomasExtras: number
  equipamento: { itemId: string; quantidade: number }[]
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
  aumentos: Partial<ValoresAtributos>
}

export interface EstadoDeJogo {
  pvAtual: number
  pvTemporario: number
  dadosDeVidaGastos: number
  inspiracao: boolean
  /** Espaços gastos por nível de magia (índice 0 = 1º nível). */
  espacosGastos: number[]
  morte: { sucessos: number; falhas: number }
}

export interface EscolhasRaciais {
  aumentos: Atributo[]
  pericias: PericiaId[]
  ferramenta: string
  ancestral: string
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
  /** Perícias escolhidas na classe (e substitutas por sobreposição). */
  periciasEscolhidas: PericiaId[]
  especializacoes: Especializavel[]
  ferramentasEscolhidas: string[]
  idiomasEscolhidos: string[]
  /** PV ganhos (só o dado, sem Con) em cada nível a partir do 2º. */
  pvPorNivel: number[]
  estado: EstadoDeJogo
  inventario: ItemInventario[]
  moedas: { pc: number; pp: number; pe: number; po: number; pl: number }
  historia: Historia
  personalidade: Personalidade
  anotacoes: string
  /** Texto completo que o próprio usuário digitou para cada habilidade. */
  anotacoesHabilidades: Record<string, string>
}
