import type { Classe } from '../tipos'

/** Fúrias por dia (LdJ p. 47). 20º nível: ilimitado. */
export function furiasPorDia(nivel: number): number | null {
  if (nivel >= 20) return null
  return nivel >= 17 ? 6 : nivel >= 12 ? 5 : nivel >= 6 ? 4 : nivel >= 3 ? 3 : 2
}

export function danoDeFuria(nivel: number): number {
  return nivel >= 16 ? 4 : nivel >= 9 ? 3 : 2
}

export function dadosCriticoBrutal(nivel: number): number {
  return nivel >= 17 ? 3 : nivel >= 13 ? 2 : nivel >= 9 ? 1 : 0
}

/** Bárbaro (LdJ p. 46–50). Resumos em palavras próprias. */
export const BARBARO: Classe = {
  id: 'barbaro',
  nome: 'Bárbaro',
  pagina: 46,
  dadoDeVida: 12,
  resistencias: ['for', 'con'],
  armaduras: ['leve', 'media', 'escudo'],
  armas: { categorias: ['simples', 'marcial'], especificas: [] },
  ferramentas: [],
  pericias: { quantidade: 2, opcoes: ['adestrarAnimais', 'atletismo', 'intimidacao', 'natureza', 'percepcao', 'sobrevivencia'] },
  equipamentoFixo: [
    { itemId: 'pacoteAventureiro', quantidade: 1 },
    { itemId: 'azagaia', quantidade: 4 },
  ],
  equipamentoEscolhas: [
    {
      id: 'arma-principal',
      opcoes: [
        { rotulo: 'Machado grande', itens: [{ itemId: 'machadoGrande', quantidade: 1 }] },
        { rotulo: 'Qualquer arma marcial corpo a corpo', itens: [{ itemId: 'qualquer:marcial-corpo', quantidade: 1 }] },
      ],
    },
    {
      id: 'arma-secundaria',
      opcoes: [
        { rotulo: 'Duas machadinhas', itens: [{ itemId: 'machadinha', quantidade: 2 }] },
        { rotulo: 'Qualquer arma simples', itens: [{ itemId: 'qualquer:simples', quantidade: 1 }] },
      ],
    },
  ],
  habilidades: [
    { nivel: 1, id: 'barbaro-furia', nome: 'Fúria', pagina: 48, resumo: 'Ação bônus, dura 1 minuto. Sem armadura pesada: vantagem em testes e resistências de Força, bônus no dano corpo a corpo com Força e resistência a dano de concussão, cortante e perfurante. Não conjura nem se concentra.' },
    { nivel: 1, id: 'barbaro-defesa', nome: 'Defesa sem Armadura', pagina: 48, resumo: 'Sem armadura, CA = 10 + Des + Con. Pode usar escudo.' },
    { nivel: 2, id: 'barbaro-descuidado', nome: 'Ataque Descuidado', pagina: 48, resumo: 'No primeiro ataque do turno, pode ganhar vantagem nos ataques corpo a corpo com Força; ataques contra você também ganham vantagem até seu próximo turno.' },
    { nivel: 2, id: 'barbaro-perigo', nome: 'Sentido de Perigo', pagina: 48, resumo: 'Vantagem em resistências de Destreza contra efeitos que você possa ver, se não estiver cego, surdo ou incapacitado.' },
    { nivel: 3, id: 'barbaro-caminho', nome: 'Caminho Primitivo', pagina: 48, resumo: 'Escolha do caminho (Furioso ou Guerreiro Totêmico), com habilidades no 3º, 6º, 10º e 14º níveis.' },
    { nivel: 5, id: 'barbaro-ataque-extra', nome: 'Ataque Extra', pagina: 49, resumo: 'Dois ataques ao usar a ação de Ataque.' },
    { nivel: 5, id: 'barbaro-movimento', nome: 'Movimento Rápido', pagina: 49, resumo: '+3 m de deslocamento sem armadura pesada.' },
    { nivel: 7, id: 'barbaro-instinto', nome: 'Instinto Selvagem', pagina: 49, resumo: 'Vantagem na iniciativa; se estiver surpreso, pode agir no primeiro turno entrando em fúria.' },
    { nivel: 9, id: 'barbaro-critico', nome: 'Crítico Brutal', pagina: 49, resumo: 'Um dado extra de dano da arma em críticos corpo a corpo; dois no 13º e três no 17º.' },
    { nivel: 11, id: 'barbaro-implacavel', nome: 'Fúria Implacável', pagina: 49, resumo: 'Em fúria, ao cair a 0 PV, resistência de Con CD 10 para ficar com 1 PV; a CD sobe 5 a cada uso até um descanso.' },
    { nivel: 15, id: 'barbaro-persistente', nome: 'Fúria Persistente', pagina: 49, resumo: 'A fúria só acaba antes do tempo se você cair inconsciente ou decidir encerrá-la.' },
    { nivel: 18, id: 'barbaro-indomavel', nome: 'Força Indomável', pagina: 49, resumo: 'Num teste de Força com resultado menor que seu valor de Força, use o valor de Força.' },
    { nivel: 20, id: 'barbaro-campeao', nome: 'Campeão Primitivo', pagina: 49, resumo: 'Força e Constituição +4, com máximo de 24.' },
  ],
  niveisIncremento: [4, 8, 12, 16, 19],
  nivelSubclasse: 3,
  nomeSubclasse: 'Caminho Primitivo',
  defesaSemArmadura: { atributo: 'con', permiteEscudo: true },
  deslocamentoExtra: (nivel) => ({ metros: nivel >= 5 ? 3 : 0, semArmadura: 'pesada' }),
  ataquesPorAcao: (nivel) => (nivel >= 5 ? 2 : 1),
  aumentosDeClasse: (nivel) => (nivel >= 20 ? { aumentos: { for: 4, con: 4 }, maximo: 24 } : null),
  recursos: ({ nivel }) => [
    { id: 'furia', nome: 'Fúria', maximo: furiasPorDia(nivel), recarga: 'longo', detalhe: `+${danoDeFuria(nivel)} no dano`, pagina: 48 },
  ],
  extras: ({ nivel }) => [
    { nome: 'Dano de fúria', valor: `+${danoDeFuria(nivel)}` },
    ...(dadosCriticoBrutal(nivel) ? [{ nome: 'Crítico brutal', valor: `+${dadosCriticoBrutal(nivel)} dado${dadosCriticoBrutal(nivel) > 1 ? 's' : ''}` }] : []),
  ],
  subclasses: [
    {
      id: 'furioso',
      nome: 'Caminho do Furioso',
      pagina: 49,
      resumo: 'Fúria levada ao extremo, sem se importar com o próprio corpo.',
      ferramentas: [],
      habilidades: [
        { nivel: 3, id: 'furioso-frenesi', nome: 'Frenesi', pagina: 49, resumo: 'Na fúria, pode entrar em frenesi: um ataque corpo a corpo extra como ação bônus a cada turno. Ao terminar, sofre um nível de exaustão.' },
        { nivel: 6, id: 'furioso-inconsciente', nome: 'Fúria Inconsciente', pagina: 49, resumo: 'Não pode ser enfeitiçado nem amedrontado em fúria; esses efeitos ficam suspensos enquanto ela durar.' },
        { nivel: 10, id: 'furioso-presenca', nome: 'Presença Intimidante', pagina: 49, resumo: 'Ação: uma criatura a até 9 m faz resistência de Sab (CD 8 + prof. + Car) ou fica amedrontada.' },
        { nivel: 14, id: 'furioso-retaliacao', nome: 'Retaliação', pagina: 50, resumo: 'Ao sofrer dano de uma criatura a até 1,5 m, pode usar a reação para atacá-la corpo a corpo.' },
      ],
    },
    {
      id: 'totemico',
      nome: 'Caminho do Guerreiro Totêmico',
      pagina: 50,
      resumo: 'Um espírito animal (urso, águia ou lobo) guia e fortalece sua fúria.',
      ferramentas: [],
      escolhas: [
        {
          id: 'totem',
          nivel: 3,
          rotulo: 'Totem Espiritual',
          pagina: 50,
          opcoes: [
            { id: 'urso', nome: 'Urso', resumo: 'Na fúria, resistência a todo dano exceto psíquico.' },
            { id: 'aguia', nome: 'Águia', resumo: 'Na fúria, ataques de oportunidade contra você têm desvantagem e você pode usar Disparada como ação bônus.' },
            { id: 'lobo', nome: 'Lobo', resumo: 'Na fúria, aliados têm vantagem em ataques corpo a corpo contra inimigos a 1,5 m de você.' },
          ],
        },
        {
          id: 'aspecto',
          nivel: 6,
          rotulo: 'Aspecto da Besta',
          pagina: 50,
          opcoes: [
            { id: 'urso', nome: 'Urso', resumo: 'Capacidade de carga dobrada e vantagem em testes de Força para empurrar, puxar e levantar.' },
            { id: 'aguia', nome: 'Águia', resumo: 'Enxerga a até 1,6 km com detalhes e luz fraca não atrapalha Percepção.' },
            { id: 'lobo', nome: 'Lobo', resumo: 'Rastreia em ritmo rápido e se move furtivamente em ritmo normal.' },
          ],
        },
        {
          id: 'sintonia',
          nivel: 14,
          rotulo: 'Sintonia Totêmica',
          pagina: 50,
          opcoes: [
            { id: 'urso', nome: 'Urso', resumo: 'Na fúria, inimigos a 1,5 m têm desvantagem para atacar outros que não você.' },
            { id: 'aguia', nome: 'Águia', resumo: 'Na fúria, ganha deslocamento de voo igual ao de caminhada.' },
            { id: 'lobo', nome: 'Lobo', resumo: 'Na fúria, ao acertar um ataque corpo a corpo, pode derrubar uma criatura Grande ou menor como ação bônus.' },
          ],
        },
      ],
      habilidades: [
        { nivel: 3, id: 'totemico-conselheiro', nome: 'Conselheiro Espiritual', pagina: 50, resumo: 'Conjura sentido bestial e falar com animais como rituais.' },
        { nivel: 3, id: 'totemico-totem', nome: 'Totem Espiritual', pagina: 50, resumo: 'Benefício na fúria conforme o animal escolhido.' },
        { nivel: 6, id: 'totemico-aspecto', nome: 'Aspecto da Besta', pagina: 50, resumo: 'Benefício permanente conforme o animal escolhido.' },
        { nivel: 10, id: 'totemico-andarilho', nome: 'Andarilho Espiritual', pagina: 50, resumo: 'Conjura comunhão com a natureza como ritual.' },
        { nivel: 14, id: 'totemico-sintonia', nome: 'Sintonia Totêmica', pagina: 50, resumo: 'Benefício poderoso na fúria conforme o animal escolhido.' },
      ],
    },
  ],
}
