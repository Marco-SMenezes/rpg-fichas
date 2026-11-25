/** Ferramentas (LdJ p. 156). Peso em kg. */
export const FERRAMENTAS_DE_ARTESAO: { nome: string; peso: number }[] = [
  { nome: 'Ferramentas de carpinteiro', peso: 3 },
  { nome: 'Ferramentas de cartógrafo', peso: 3 },
  { nome: 'Ferramentas de costureiro', peso: 2.5 },
  { nome: 'Ferramentas de coureiro', peso: 2.5 },
  { nome: 'Ferramentas de entalhador', peso: 2.5 },
  { nome: 'Ferramentas de ferreiro', peso: 4 },
  { nome: 'Ferramentas de funileiro', peso: 5 },
  { nome: 'Ferramentas de joalheiro', peso: 1 },
  { nome: 'Ferramentas de oleiro', peso: 1.5 },
  { nome: 'Ferramentas de pedreiro', peso: 4 },
  { nome: 'Ferramentas de pintor', peso: 2.5 },
  { nome: 'Ferramentas de sapateiro', peso: 2.5 },
  { nome: 'Ferramentas de vidreiro', peso: 2.5 },
  { nome: 'Suprimentos de alquimista', peso: 4 },
  { nome: 'Suprimentos de cervejeiro', peso: 4.5 },
  { nome: 'Suprimentos de caligrafia', peso: 2.5 },
  { nome: 'Utensílios de cozinheiro', peso: 4 },
]

export const INSTRUMENTOS: { nome: string; peso: number }[] = [
  { nome: 'Alaúde', peso: 1 },
  { nome: 'Flauta', peso: 0.5 },
  { nome: 'Flauta de pã', peso: 1 },
  { nome: 'Gaita de foles', peso: 3 },
  { nome: 'Lira', peso: 1 },
  { nome: 'Oboé', peso: 0.5 },
  { nome: 'Tambor', peso: 1.5 },
  { nome: 'Trombeta', peso: 1 },
  { nome: 'Violino', peso: 3 },
  { nome: 'Xilofone', peso: 5 },
]

export const KITS_DE_JOGO: { nome: string; peso: number }[] = [
  { nome: 'Baralho de cartas', peso: 0 },
  { nome: 'Conjunto de dados', peso: 0 },
  { nome: 'Jogo dos três dragões', peso: 0 },
  { nome: 'Xadrez do dragão', peso: 0.25 },
]

export const PESO_FERRAMENTA: Record<string, number> = Object.fromEntries(
  [...FERRAMENTAS_DE_ARTESAO, ...INSTRUMENTOS, ...KITS_DE_JOGO].map((x) => [x.nome, x.peso]),
)
