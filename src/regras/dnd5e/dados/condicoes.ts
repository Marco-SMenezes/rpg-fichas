/** Condições (LdJ p. 291–293). Resumos em palavras próprias. */
export interface Condicao {
  id: string
  nome: string
  pagina: number
  resumo: string
  /** A criatura não pode se mover (deslocamento 0). */
  paraDeslocamento?: boolean
}

export const CONDICOES: Condicao[] = [
  { id: 'agarrado', nome: 'Agarrado', pagina: 291, paraDeslocamento: true, resumo: 'Deslocamento 0. Acaba se quem agarra fica incapacitado ou se você é afastado dele.' },
  { id: 'amedrontado', nome: 'Amedrontado', pagina: 291, resumo: 'Desvantagem em testes e ataques enquanto vê a fonte do medo; não pode se aproximar dela por vontade própria.' },
  { id: 'atordoado', nome: 'Atordoado', pagina: 291, paraDeslocamento: true, resumo: 'Incapacitado, não se move e fala com dificuldade. Falha em resistências de For e Des; ataques contra você têm vantagem.' },
  { id: 'caido', nome: 'Caído', pagina: 291, resumo: 'Só rasteja (ou se levanta gastando metade do deslocamento). Desvantagem nos seus ataques; ataques a até 1,5 m contra você têm vantagem, mais longe têm desvantagem.' },
  { id: 'cego', nome: 'Cego', pagina: 291, resumo: 'Não vê e falha em testes que dependem da visão. Ataques contra você têm vantagem; os seus têm desvantagem.' },
  { id: 'enfeiticado', nome: 'Enfeitiçado', pagina: 292, resumo: 'Não ataca nem mira com efeitos nocivos quem o enfeitiçou, e essa criatura tem vantagem em testes sociais com você.' },
  { id: 'envenenado', nome: 'Envenenado', pagina: 292, resumo: 'Desvantagem em jogadas de ataque e testes de habilidade.' },
  { id: 'impedido', nome: 'Impedido', pagina: 292, paraDeslocamento: true, resumo: 'Deslocamento 0. Desvantagem nos seus ataques e em resistências de Des; ataques contra você têm vantagem.' },
  { id: 'incapacitado', nome: 'Incapacitado', pagina: 292, resumo: 'Não pode fazer ações nem reações.' },
  { id: 'inconsciente', nome: 'Inconsciente', pagina: 292, paraDeslocamento: true, resumo: 'Incapacitado, larga o que segura e cai. Falha em resistências de For e Des; ataques contra você têm vantagem e, a até 1,5 m, acertos viram críticos.' },
  { id: 'invisivel', nome: 'Invisível', pagina: 293, resumo: 'Não pode ser visto sem magia ou sentido especial. Seus ataques têm vantagem; ataques contra você têm desvantagem.' },
  { id: 'paralisado', nome: 'Paralisado', pagina: 293, paraDeslocamento: true, resumo: 'Incapacitado, não se move nem fala. Falha em resistências de For e Des; ataques contra você têm vantagem e, a até 1,5 m, acertos viram críticos.' },
  { id: 'petrificado', nome: 'Petrificado', pagina: 293, paraDeslocamento: true, resumo: 'Vira pedra: incapacitado, não se move nem fala. Resistência a todo dano e imune a veneno e doença; ataques contra você têm vantagem.' },
  { id: 'surdo', nome: 'Surdo', pagina: 293, resumo: 'Não ouve e falha em testes que dependem da audição.' },
]

export const CONDICAO_POR_ID: Record<string, Condicao> = Object.fromEntries(CONDICOES.map((c) => [c.id, c]))

/** Efeitos acumulados de cada nível de exaustão (LdJ p. 292). */
export const EXAUSTAO: string[] = [
  'Sem exaustão.',
  'Desvantagem em testes de habilidade.',
  'Deslocamento pela metade.',
  'Desvantagem em ataques e testes de resistência.',
  'PV máximo pela metade.',
  'Deslocamento 0.',
  'Morte.',
]
