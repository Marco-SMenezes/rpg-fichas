import type { Atributo, EscolhaDeTalento, OpcaoDeEscolha, PericiaId, Talento } from '../tipos'
import { NOME_ATRIBUTO, PERICIAS } from './atributos'
import { ARMAS } from './equipamento'
import { MAGIAS } from './magias'
import { MANOBRAS } from './manobras'
import { IDIOMAS } from './racas'

/*
 * Talentos (regra opcional, LdJ p. 167–172). Resumos em palavras próprias.
 * Só os efeitos que mexem em números entram nas contas; o resto fica no resumo.
 */

const opcao = (id: string, nome: string, resumo = ''): OpcaoDeEscolha => ({ id, nome, resumo })

/** +1 num dos atributos listados (até 20). */
function escolhaDeAtributo(...atributos: Atributo[]): EscolhaDeTalento {
  return { id: 'atributo', rotulo: 'Atributo (+1)', opcoes: () => atributos.map((a) => opcao(a, NOME_ATRIBUTO[a])) }
}
const mais1 = (e: Record<string, string>) => (e.atributo ? { [e.atributo]: 1 } : {})

const serie = (prefixo: string, rotulo: string, n: number, opcoes: EscolhaDeTalento['opcoes']): EscolhaDeTalento[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefixo}${i + 1}`, rotulo: `${rotulo} ${i + 1}`, opcoes }))
const valores = (prefixo: string, e: Record<string, string>) =>
  Object.entries(e)
    .filter(([k, v]) => v && k.replace(/\d+$/, '') === prefixo)
    .map(([, v]) => v)

const LISTAS = [
  ['bardo', 'Bardo', 'car'],
  ['bruxo', 'Bruxo', 'car'],
  ['clerigo', 'Clérigo', 'sab'],
  ['druida', 'Druida', 'sab'],
  ['feiticeiro', 'Feiticeiro', 'car'],
  ['mago', 'Mago', 'int'],
] as const
const escolhaDeLista: EscolhaDeTalento = {
  id: 'lista',
  rotulo: 'Lista de magias',
  opcoes: () => LISTAS.map(([id, nome, at]) => opcao(id, nome, `Conjura com ${NOME_ATRIBUTO[at]}.`)),
}
const magiasDaLista = (nivel: number, filtro: (m: (typeof MAGIAS)[number]) => boolean = () => true) => (e: Record<string, string>) =>
  MAGIAS.filter((m) => m.nivel === nivel && (!e.lista || m.classes.includes(e.lista)) && filtro(m)).map((m) => opcao(m.id, m.nome, m.resumo))
const nomeDaMagia = (id: string) => MAGIAS.find((m) => m.id === id)?.nome ?? id
const nomeDaManobra = (id: string) => MANOBRAS.find((m) => m.id === id)?.nome ?? id

const PERICIA_OPCOES = () => PERICIAS.map((x) => opcao(x.id, x.nome))
const IDIOMA_OPCOES = () => [...IDIOMAS.padrao, ...IDIOMAS.exoticos].map((x) => opcao(x, x))

export const TALENTOS: Talento[] = [
  {
    id: 'adepto-elemental',
    nome: 'Adepto Elemental',
    pagina: 167,
    resumo: 'Suas magias ignoram resistência ao tipo escolhido, e 1 nos dados de dano desse tipo conta como 2. Pode pegar de novo com outro tipo.',
    requisito: { texto: 'Conjurar pelo menos uma magia', conjurador: true },
    repetivel: true,
    escolhas: [{ id: 'tipo', rotulo: 'Tipo de dano', opcoes: () => ['ácido', 'elétrico', 'fogo', 'frio', 'trovão'].map((x) => opcao(x, x)) }],
    efeitos: (e) => ({ detalhes: e.tipo ? [`Tipo: ${e.tipo}`] : [] }),
  },
  {
    id: 'adepto-marcial',
    nome: 'Adepto Marcial',
    pagina: 167,
    resumo: 'Aprende duas manobras do Mestre de Batalha e ganha um dado de superioridade d6 (ou mais um, se já tiver), que volta no descanso curto ou longo.',
    escolhas: serie('manobra', 'Manobra', 2, () => MANOBRAS),
    efeitos: (e) => ({
      recursos: [{ id: 'talento-superioridade', nome: 'Dado de superioridade (talento)', maximo: 1, recarga: 'curto', detalhe: 'd6', pagina: 167 }],
      detalhes: valores('manobra', e).length ? [`Manobras: ${valores('manobra', e).map(nomeDaManobra).join(', ')}`] : [],
    }),
  },
  {
    id: 'alerta',
    nome: 'Alerta',
    pagina: 167,
    resumo: '+5 na iniciativa, não é surpreendido enquanto consciente e criaturas escondidas não ganham vantagem contra você por isso.',
    efeitos: () => ({ iniciativa: 5 }),
  },
  {
    id: 'ambidestro',
    nome: 'Ambidestro',
    pagina: 167,
    resumo: '+1 na CA com uma arma corpo a corpo em cada mão; luta com duas armas mesmo que não sejam leves; saca ou guarda duas armas de uma vez.',
  },
  {
    id: 'atacante-bestial',
    nome: 'Atacante Bestial',
    pagina: 167,
    resumo: 'Uma vez por turno, rola de novo os dados de dano de um ataque corpo a corpo com arma e fica com o melhor.',
  },
  {
    id: 'atirador-agucado',
    nome: 'Atirador Aguçado',
    pagina: 167,
    resumo: 'Sem desvantagem a longa distância, ignora meia cobertura e três quartos, e pode trocar −5 no ataque por +10 no dano com arma à distância.',
  },
  {
    id: 'atirador-de-magia',
    nome: 'Atirador de Magia',
    pagina: 167,
    resumo: 'Dobra o alcance de magias com jogada de ataque, ignora meia cobertura e três quartos nelas e aprende um truque de ataque.',
    requisito: { texto: 'Conjurar pelo menos uma magia', conjurador: true },
    escolhas: [escolhaDeLista, { id: 'truque', rotulo: 'Truque com jogada de ataque', opcoes: magiasDaLista(0, (m) => /ataque/i.test(m.resumo)) }],
    efeitos: (e) => ({ detalhes: e.truque ? [`Truque: ${nomeDaMagia(e.truque)}`] : [] }),
  },
  {
    id: 'ator',
    nome: 'Ator',
    pagina: 168,
    resumo: '+1 Car; vantagem em Atuação e Enganação ao se passar por outra pessoa; imita vozes e sons depois de ouvir por 1 minuto.',
    efeitos: () => ({ aumentos: { car: 1 } }),
  },
  {
    id: 'atleta',
    nome: 'Atleta',
    pagina: 168,
    resumo: '+1 For ou Des; levantar custa 1,5 m, escalar não custa movimento extra e saltos com corrida precisam só de 1,5 m.',
    escolhas: [escolhaDeAtributo('for', 'des')],
    efeitos: (e) => ({ aumentos: mais1(e) }),
  },
  {
    id: 'combatente-montado',
    nome: 'Combatente Montado',
    pagina: 168,
    resumo: 'Montado: vantagem contra criaturas a pé menores que a montaria, pode atrair para si ataques contra ela e ela evita dano em testes de Des.',
  },
  {
    id: 'conjurador-de-guerra',
    nome: 'Conjurador de Guerra',
    pagina: 169,
    resumo: 'Vantagem em Con para manter concentração, conjura com as mãos ocupadas e pode usar uma magia como ataque de oportunidade.',
    requisito: { texto: 'Conjurar pelo menos uma magia', conjurador: true },
  },
  {
    id: 'duelista-defensivo',
    nome: 'Duelista Defensivo',
    pagina: 169,
    resumo: 'Reação com arma de acuidade: soma a proficiência na CA contra um ataque corpo a corpo.',
    requisito: { texto: 'Destreza 13', atributos: ['des'], minimo: 13 },
  },
  {
    id: 'especialista-em-besta',
    nome: 'Especialista em Besta',
    pagina: 169,
    resumo: 'Ignora a propriedade recarga das bestas, sem desvantagem à distância com inimigo a 1,5 m e ataque bônus com besta de mão.',
  },
  {
    id: 'conjurador-de-ritual',
    nome: 'Conjurador de Ritual',
    pagina: 169,
    resumo: 'Livro de rituais com duas magias de ritual de 1º nível de uma lista; pode copiar outros rituais que encontrar.',
    requisito: { texto: 'Inteligência ou Sabedoria 13', atributos: ['int', 'sab'], minimo: 13 },
    escolhas: [escolhaDeLista, ...serie('ritual', 'Ritual de 1º nível', 2, magiasDaLista(1, (m) => m.ritual))],
    efeitos: (e) => ({ detalhes: valores('ritual', e).length ? [`Rituais: ${valores('ritual', e).map(nomeDaMagia).join(', ')}`] : [] }),
  },
  {
    id: 'curandeiro',
    nome: 'Curandeiro',
    pagina: 169,
    resumo: 'Estabilizar com kit de curandeiro devolve 1 PV; uma ação com o kit cura 1d6 + 4 + o nível máximo de dados de vida da criatura, uma vez por descanso.',
  },
  {
    id: 'especialista-em-briga',
    nome: 'Especialista em Briga',
    pagina: 169,
    resumo: '+1 For ou Con; proficiência com armas improvisadas; desarmado causa 1d4; ao acertar desarmado ou com improvisada, ação bônus para agarrar.',
    escolhas: [escolhaDeAtributo('for', 'con')],
    efeitos: (e) => ({ aumentos: mais1(e) }),
  },
  {
    id: 'explorador-de-cavernas',
    nome: 'Explorador de Cavernas',
    pagina: 169,
    resumo: 'Vantagem para achar portas secretas e em resistências contra armadilhas, resistência ao dano delas e procura armadilhas em ritmo normal.',
  },
  {
    id: 'imobilizador',
    nome: 'Imobilizador',
    pagina: 169,
    resumo: 'Vantagem para atacar quem você agarra e pode tentar imobilizar a criatura agarrada.',
    requisito: { texto: 'Força 13', atributos: ['for'], minimo: 13 },
  },
  {
    id: 'iniciado-em-magia',
    nome: 'Iniciado em Magia',
    pagina: 170,
    resumo: 'Dois truques e uma magia de 1º nível de uma lista; a magia é conjurada uma vez por descanso longo sem espaço.',
    escolhas: [
      escolhaDeLista,
      ...serie('truque', 'Truque', 2, magiasDaLista(0)),
      { id: 'magia', rotulo: 'Magia de 1º nível', opcoes: magiasDaLista(1) },
    ],
    efeitos: (e) => ({
      recursos: e.magia ? [{ id: 'talento-iniciado', nome: nomeDaMagia(e.magia), maximo: 1, recarga: 'longo', detalhe: 'Iniciado em Magia', pagina: 170 }] : [],
      detalhes: [
        ...(valores('truque', e).length ? [`Truques: ${valores('truque', e).map(nomeDaMagia).join(', ')}`] : []),
        ...(e.magia ? [`1º nível: ${nomeDaMagia(e.magia)}`] : []),
      ],
    }),
  },
  {
    id: 'maestria-armadura-media',
    nome: 'Maestria em Armadura Média',
    pagina: 170,
    resumo: 'Armadura média não atrapalha a Furtividade e soma até +3 de Destreza na CA, em vez de +2.',
    requisito: { texto: 'Proficiência em armadura média', armadura: 'media' },
    efeitos: () => ({ desMaxArmaduraMedia: 3 }),
  },
  {
    id: 'maestria-armadura-pesada',
    nome: 'Maestria em Armadura Pesada',
    pagina: 170,
    resumo: '+1 For; de armadura pesada, reduz em 3 o dano de concussão, cortante e perfurante não mágico.',
    requisito: { texto: 'Proficiência em armadura pesada', armadura: 'pesada' },
    efeitos: () => ({ aumentos: { for: 1 } }),
  },
  {
    id: 'investida-poderosa',
    nome: 'Investida Poderosa',
    pagina: 170,
    resumo: 'Depois de Disparar 3 m em linha reta, ataque corpo a corpo ou empurrão como ação bônus: +5 no dano ou empurra 3 m.',
  },
  {
    id: 'maestria-arma-de-haste',
    nome: 'Maestria em Arma de Haste',
    pagina: 170,
    resumo: 'Com glaive, alabarda ou bordão, ataque bônus com a outra ponta (1d4); com essas armas e a lança longa, ataque de oportunidade em quem entra no alcance.',
  },
  {
    id: 'matador-de-conjuradores',
    nome: 'Matador de Conjuradores',
    pagina: 170,
    resumo: 'Reação para atacar quem conjura a 1,5 m, desvantagem na concentração de quem você fere e vantagem em resistências contra magias de quem está a 1,5 m.',
  },
  {
    id: 'lider-inspirador',
    nome: 'Líder Inspirador',
    pagina: 170,
    resumo: '10 minutos de discurso: até seis criaturas ganham PV temporários iguais a nível + Car, uma vez por descanso.',
    requisito: { texto: 'Carisma 13', atributos: ['car'], minimo: 13 },
  },
  {
    id: 'mente-afiada',
    nome: 'Mente Afiada',
    pagina: 170,
    resumo: '+1 Int; sempre sabe o norte e as horas, e lembra de tudo o que viu ou ouviu no último mês.',
    efeitos: () => ({ aumentos: { int: 1 } }),
  },
  {
    id: 'mestre-de-armas',
    nome: 'Mestre de Armas',
    pagina: 170,
    resumo: '+1 For ou Des e proficiência com quatro armas simples ou marciais.',
    escolhas: [escolhaDeAtributo('for', 'des'), ...serie('arma', 'Arma', 4, () => ARMAS.map((a) => opcao(a.id, a.nome)))],
    efeitos: (e) => ({ aumentos: mais1(e), armas: valores('arma', e) }),
  },
  {
    id: 'mestre-de-armas-grandes',
    nome: 'Mestre de Armas Grandes',
    pagina: 171,
    resumo: 'Crítico ou abate dão um ataque bônus; com arma pesada, pode trocar −5 no ataque por +10 no dano.',
  },
  {
    id: 'mobilidade',
    nome: 'Mobilidade',
    pagina: 171,
    resumo: '+3 m de deslocamento; Disparar ignora terreno difícil; quem você ataca corpo a corpo não faz ataque de oportunidade em você nesse turno.',
    efeitos: () => ({ deslocamento: 3 }),
  },
  {
    id: 'mestre-de-escudo',
    nome: 'Mestre de Escudo',
    pagina: 171,
    resumo: 'Empurrão com o escudo como ação bônus ao atacar, soma o escudo em resistências de Des contra efeitos em você e evita todo o dano quando passa.',
  },
  {
    id: 'observador',
    nome: 'Observador',
    pagina: 171,
    resumo: '+1 Int ou Sab; lê lábios e ganha +5 na Percepção e na Investigação passivas.',
    escolhas: [escolhaDeAtributo('int', 'sab')],
    efeitos: (e) => ({ aumentos: mais1(e), passivas: 5 }),
  },
  {
    id: 'perito',
    nome: 'Perito',
    pagina: 172,
    resumo: 'Proficiência em três perícias ou ferramentas à escolha (aqui, perícias).',
    escolhas: serie('pericia', 'Perícia', 3, PERICIA_OPCOES),
    efeitos: (e) => ({ pericias: valores('pericia', e) as PericiaId[] }),
  },
  {
    id: 'poliglota',
    nome: 'Poliglota',
    pagina: 172,
    resumo: '+1 Int; três idiomas à escolha e cria cifras que só quem você ensina decifra.',
    escolhas: serie('idioma', 'Idioma', 3, IDIOMA_OPCOES),
    efeitos: (e) => ({ aumentos: { int: 1 }, idiomas: valores('idioma', e) }),
  },
  {
    id: 'protecao-leve',
    nome: 'Proteção Leve',
    pagina: 172,
    resumo: '+1 For ou Des e proficiência com armaduras leves.',
    escolhas: [escolhaDeAtributo('for', 'des')],
    efeitos: (e) => ({ aumentos: mais1(e), armaduras: ['leve'] }),
  },
  {
    id: 'robusto',
    nome: 'Robusto',
    pagina: 172,
    resumo: '+2 PV máximos por nível, inclusive os níveis que ainda vierem.',
    efeitos: () => ({ pvPorNivel: 2 }),
  },
  {
    id: 'sentinela',
    nome: 'Sentinela',
    pagina: 172,
    resumo: 'Ataque de oportunidade zera o deslocamento do alvo, vale mesmo contra Desengajar e você pode atacar quem ataca um aliado ao seu lado.',
  },
  {
    id: 'protecao-moderada',
    nome: 'Proteção Moderada',
    pagina: 172,
    resumo: '+1 For ou Des e proficiência com armaduras médias e escudos.',
    requisito: { texto: 'Proficiência em armadura leve', armadura: 'leve' },
    escolhas: [escolhaDeAtributo('for', 'des')],
    efeitos: (e) => ({ aumentos: mais1(e), armaduras: ['media', 'escudo'] }),
  },
  {
    id: 'sorrateiro',
    nome: 'Sorrateiro',
    pagina: 172,
    resumo: 'Esconde-se na penumbra, errar um ataque à distância não revela sua posição e penumbra não atrapalha sua Percepção.',
    requisito: { texto: 'Destreza 13', atributos: ['des'], minimo: 13 },
  },
  {
    id: 'protecao-pesada',
    nome: 'Proteção Pesada',
    pagina: 172,
    resumo: '+1 For e proficiência com armaduras pesadas.',
    requisito: { texto: 'Proficiência em armadura média', armadura: 'media' },
    efeitos: () => ({ aumentos: { for: 1 }, armaduras: ['pesada'] }),
  },
  {
    id: 'resiliente',
    nome: 'Resiliente',
    pagina: 172,
    resumo: '+1 no atributo escolhido e proficiência nos testes de resistência dele.',
    escolhas: [escolhaDeAtributo('for', 'des', 'con', 'int', 'sab', 'car')],
    efeitos: (e) => ({ aumentos: mais1(e), resistencias: e.atributo ? [e.atributo as Atributo] : [] }),
  },
  {
    id: 'resistente',
    nome: 'Resistente',
    pagina: 172,
    resumo: '+1 Con; ao gastar dados de vida, recupera no mínimo o dobro do modificador de Con.',
    efeitos: () => ({ aumentos: { con: 1 } }),
  },
  {
    id: 'sortudo',
    nome: 'Sortudo',
    pagina: 172,
    resumo: 'Três pontos de sorte por descanso longo: rola um d20 extra num ataque, teste ou resistência seu, ou num ataque contra você, e escolhe.',
    efeitos: () => ({ recursos: [{ id: 'talento-sorte', nome: 'Pontos de sorte', maximo: 3, recarga: 'longo', detalhe: 'd20 extra', pagina: 172 }] }),
  },
]

export const TALENTO_POR_ID: Record<string, Talento> = Object.fromEntries(TALENTOS.map((t) => [t.id, t]))
