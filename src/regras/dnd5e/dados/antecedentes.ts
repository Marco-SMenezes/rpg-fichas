import type { Antecedente } from '../tipos'

export const ANTECEDENTES: Antecedente[] = [
  {
    id: 'criminoso',
    nome: 'Criminoso',
    pagina: 134,
    pericias: ['enganacao', 'furtividade'],
    ferramentas: ['Um tipo de kit de jogo', 'Ferramentas de ladrão'],
    idiomasExtras: 0,
    equipamento: [
      { itemId: 'peDeCabra', quantidade: 1 },
      { itemId: 'roupasEscuras', quantidade: 1 },
      { itemId: 'algibeira', quantidade: 1 },
    ],
    moedasPo: 15,
    caracteristica: {
      id: 'criminoso-contato',
      nome: 'Contato Criminal',
      resumo: 'Tem um contato de confiança numa rede criminosa e sabe como trocar mensagens com ele mesmo à distância.',
      pagina: 134,
    },
  },
  {
    id: 'charlatao',
    nome: 'Charlatão',
    pagina: 133,
    pericias: ['enganacao', 'prestidigitacao'],
    ferramentas: ['Kit de disfarce', 'Kit de falsificação'],
    idiomasExtras: 0,
    equipamento: [
      { itemId: 'roupasFinas', quantidade: 1 },
      { itemId: 'kitDeDisfarce', quantidade: 1 },
      { itemId: 'ferramentasDeTrapaca', quantidade: 1 },
      { itemId: 'algibeira', quantidade: 1 },
    ],
    moedasPo: 15,
    caracteristica: {
      id: 'charlatao-identidade',
      nome: 'Identidade Falsa',
      resumo: 'Mantém uma segunda identidade com documentos e conhecidos, e falsifica documentos que já tenha visto.',
      pagina: 133,
    },
  },
]
