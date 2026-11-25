import type { Classe, EscolhaDeClasse } from '../tipos'
import { INSTRUMENTOS } from './ferramentas'
import { PERICIAS } from './atributos'

export function dadoDeInspiracao(nivel: number): string {
  return nivel >= 15 ? 'd12' : nivel >= 10 ? 'd10' : nivel >= 5 ? 'd8' : 'd6'
}

export function dadoCancaoDeDescanso(nivel: number): string | null {
  if (nivel < 2) return null
  return nivel >= 17 ? 'd12' : nivel >= 13 ? 'd10' : nivel >= 9 ? 'd8' : 'd6'
}

const instrumento = (n: number): EscolhaDeClasse => ({
  id: `instrumento${n}`,
  nivel: 1,
  rotulo: `Instrumento musical ${n} de 3`,
  pagina: 52,
  opcoes: INSTRUMENTOS.map((x) => ({ id: x.nome, nome: x.nome, resumo: 'Proficiência.' })),
})

/** Bardo (LdJ p. 51–55). Resumos em palavras próprias. */
export const BARDO: Classe = {
  id: 'bardo',
  nome: 'Bardo',
  pagina: 51,
  dadoDeVida: 8,
  resistencias: ['des', 'car'],
  armaduras: ['leve'],
  armas: { categorias: ['simples'], especificas: ['bestaDeMao', 'espadaLonga', 'rapieira', 'espadaCurta'] },
  ferramentas: [],
  pericias: { quantidade: 3, opcoes: PERICIAS.map((x) => x.id) },
  equipamentoFixo: [
    { itemId: 'couro', quantidade: 1 },
    { itemId: 'adaga', quantidade: 1 },
  ],
  equipamentoEscolhas: [
    {
      id: 'arma',
      opcoes: [
        { rotulo: 'Rapieira', itens: [{ itemId: 'rapieira', quantidade: 1 }] },
        { rotulo: 'Espada longa', itens: [{ itemId: 'espadaLonga', quantidade: 1 }] },
        { rotulo: 'Qualquer arma simples', itens: [{ itemId: 'qualquer:simples', quantidade: 1 }] },
      ],
    },
    {
      id: 'pacote',
      opcoes: [
        { rotulo: 'Pacote de diplomata', itens: [{ itemId: 'pacoteDiplomata', quantidade: 1 }] },
        { rotulo: 'Pacote de artista', itens: [{ itemId: 'pacoteArtista', quantidade: 1 }] },
      ],
    },
    {
      id: 'instrumento',
      opcoes: [
        { rotulo: 'Alaúde', itens: [{ itemId: 'instrumento', quantidade: 1 }] },
        { rotulo: 'Outro instrumento musical', itens: [{ itemId: 'instrumento', quantidade: 1 }] },
      ],
    },
  ],
  escolhas: [instrumento(1), instrumento(2), instrumento(3)],
  habilidades: [
    { nivel: 1, id: 'bardo-conjuracao', nome: 'Conjuração', pagina: 52, resumo: 'Conhece magias de bardo e conjura com Carisma, usando um instrumento como foco; conjura rituais que conhece.' },
    { nivel: 1, id: 'bardo-inspiracao', nome: 'Inspiração de Bardo', pagina: 53, resumo: 'Ação bônus: uma criatura a 18 m ganha um dado para somar num ataque, teste ou resistência em 10 minutos. Usos = Carisma por descanso longo (curto a partir do 5º).' },
    { nivel: 2, id: 'bardo-versatilidade', nome: 'Versatilidade', pagina: 54, resumo: 'Metade da proficiência em testes de habilidade sem proficiência.' },
    { nivel: 2, id: 'bardo-cancao', nome: 'Canção de Descanso', pagina: 54, resumo: 'Quem gastar dados de vida no descanso curto ouvindo você recupera um dado extra (d6, d8 no 9º, d10 no 13º, d12 no 17º).' },
    { nivel: 3, id: 'bardo-colegio', nome: 'Colégio de Bardo', pagina: 54, resumo: 'Escolha do colégio (Conhecimento ou Bravura), com habilidades no 3º, 6º e 14º níveis.' },
    { nivel: 3, id: 'bardo-aptidao', nome: 'Aptidão', pagina: 54, resumo: 'Especialização em duas perícias proficientes; mais duas no 10º nível.' },
    { nivel: 5, id: 'bardo-fonte', nome: 'Fonte de Inspiração', pagina: 54, resumo: 'A Inspiração de Bardo volta no descanso curto ou longo.' },
    { nivel: 6, id: 'bardo-protecao', nome: 'Canção de Proteção', pagina: 54, resumo: 'Ação: aliados a 9 m têm vantagem contra amedrontamento e encantamento até o fim do seu próximo turno.' },
    { nivel: 10, id: 'bardo-segredos', nome: 'Segredos Mágicos', pagina: 54, resumo: 'Aprende duas magias de qualquer classe; mais duas no 14º e no 18º nível.' },
    { nivel: 20, id: 'bardo-superior', nome: 'Inspiração Superior', pagina: 54, resumo: 'Ao rolar iniciativa sem Inspiração de Bardo, recupera um uso.' },
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 3,
  nomeSubclasse: 'Colégio de Bardo',
  especializacao: [
    { nivel: 3, quantidade: 2 },
    { nivel: 10, quantidade: 2 },
  ],
  meiaProficiencia: (nivel) => nivel >= 2,
  // Duas magias de qualquer classe no 10º, 14º e 18º; contam nas magias conhecidas.
  segredosMagicos: (nivel) => ({ total: [10, 14, 18].filter((n) => n <= nivel).length * 2, alemDoLimite: 0 }),
  conjuracao: { tipo: 'completo', atributo: 'car' },
  magias: {
    truques: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    conhecidas: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  },
  recursos: ({ nivel, mod }) => [
    { id: 'inspiracao-bardo', nome: 'Inspiração de Bardo', maximo: Math.max(1, mod.car), recarga: nivel >= 5 ? 'curto' : 'longo', detalhe: dadoDeInspiracao(nivel), pagina: 53 },
  ],
  extras: ({ nivel }) => [
    { nome: 'Dado de inspiração', valor: dadoDeInspiracao(nivel) },
    ...(dadoCancaoDeDescanso(nivel) ? [{ nome: 'Canção de descanso', valor: `+1${dadoCancaoDeDescanso(nivel)}` }] : []),
  ],
  subclasses: [
    {
      id: 'conhecimento',
      nome: 'Colégio do Conhecimento',
      pagina: 54,
      resumo: 'Colecionadores de saberes e segredos.',
      ferramentas: [],
      // Segredos Mágicos Adicionais: duas magias de qualquer classe que não contam no limite.
      segredosMagicos: (nivel) => (nivel >= 6 ? { total: 2, alemDoLimite: 2 } : { total: 0, alemDoLimite: 0 }),
      habilidades: [
        { nivel: 3, id: 'conhecimento-proficiencia', nome: 'Proficiência Adicional', pagina: 54, resumo: 'Três perícias à escolha (anote nas perícias).' },
        { nivel: 3, id: 'conhecimento-palavras', nome: 'Palavras de Interrupção', pagina: 54, resumo: 'Reação: gasta uma Inspiração para subtrair o dado do ataque, teste ou dano de uma criatura a 18 m.' },
        { nivel: 6, id: 'conhecimento-segredos', nome: 'Segredos Mágicos Adicionais', pagina: 55, resumo: 'Duas magias de qualquer classe, que contam como de bardo e não entram no limite de magias conhecidas.' },
        { nivel: 14, id: 'conhecimento-pericia', nome: 'Perícia Inigualável', pagina: 55, resumo: 'Gasta uma Inspiração para somar o dado ao próprio teste de habilidade.' },
      ],
    },
    {
      id: 'bravura',
      nome: 'Colégio da Bravura',
      pagina: 55,
      resumo: 'Bardos que inspiram nas batalhas.',
      ferramentas: [],
      armaduras: ['media', 'escudo'],
      armasCategorias: ['marcial'],
      ataquesPorAcao: (nivel) => (nivel >= 6 ? 2 : 1),
      habilidades: [
        { nivel: 3, id: 'bravura-proficiencia', nome: 'Proficiência Adicional', pagina: 55, resumo: 'Armaduras médias, escudos e armas marciais.' },
        { nivel: 3, id: 'bravura-combate', nome: 'Inspiração em Combate', pagina: 55, resumo: 'Quem tem sua Inspiração pode somar o dado ao dano ou à CA contra um ataque.' },
        { nivel: 6, id: 'bravura-ataque-extra', nome: 'Ataque Extra', pagina: 55, resumo: 'Dois ataques ao usar a ação de Ataque.' },
        { nivel: 14, id: 'bravura-magia', nome: 'Magia de Batalha', pagina: 55, resumo: 'Ao usar a ação para uma magia, pode atacar com arma como ação bônus.' },
      ],
    },
  ],
}
