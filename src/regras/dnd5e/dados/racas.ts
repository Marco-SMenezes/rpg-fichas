import type { Raca } from '../tipos'

export const ELFO: Raca = {
  id: 'elfo',
  nome: 'Elfo',
  pagina: 21,
  tamanho: 'Médio',
  deslocamento: 9,
  aumentos: { des: 2 },
  idiomas: ['Comum', 'Élfico'],
  pericias: ['percepcao'],
  armas: [],
  tracos: [
    {
      id: 'elfo-visao-escuro',
      nome: 'Visão no Escuro',
      resumo: 'Enxerga na penumbra a até 18 m como em luz plena, e no escuro como penumbra (sem cores).',
      pagina: 23,
    },
    {
      id: 'elfo-sentidos',
      nome: 'Sentidos Aguçados',
      resumo: 'Proficiência em Percepção.',
      pagina: 23,
    },
    {
      id: 'elfo-ancestral',
      nome: 'Ancestral Feérico',
      resumo: 'Vantagem em resistências contra ficar enfeitiçado; magia não o põe para dormir.',
      pagina: 23,
    },
    {
      id: 'elfo-transe',
      nome: 'Transe',
      resumo: 'Não dorme: medita 4 horas e recebe o mesmo benefício de 8 horas de sono.',
      pagina: 23,
    },
  ],
  subracas: [
    {
      id: 'elfo-floresta',
      nome: 'Elfo da floresta',
      pagina: 24,
      aumentos: { sab: 1 },
      deslocamento: 10.5,
      pericias: [],
      armas: ['espadaLonga', 'espadaCurta', 'arcoLongo', 'arcoCurto'],
      tracos: [
        {
          id: 'elfo-floresta-armas',
          nome: 'Treinamento Élfico com Armas',
          resumo: 'Proficiência com espada longa, espada curta, arco longo e arco curto.',
          pagina: 24,
        },
        {
          id: 'elfo-floresta-pes',
          nome: 'Pés Ligeiros',
          resumo: 'Deslocamento base de 10,5 m.',
          pagina: 24,
        },
        {
          id: 'elfo-floresta-mascara',
          nome: 'Máscara da Natureza',
          resumo:
            'Pode tentar se esconder quando só está levemente encoberto por fenômenos naturais (folhagem, chuva, neve, névoa).',
          pagina: 24,
        },
      ],
    },
  ],
}

export const RACAS: Raca[] = [ELFO]
