import { ATRIBUTOS } from '../dados/atributos'
import { obterClasse, obterSubclasse } from '../dados'
import { TALENTO_POR_ID } from '../dados/talentos'
import type { EscolhaDeClasse, HabilidadeDeClasse, Personagem } from '../tipos'

/** Onde o nó está em relação ao nível da personagem. */
export type EstadoDoNo = 'liberado' | 'atual' | 'proximo' | 'futuro'

/** Uma decisão que a personagem toma naquele nível. `valor` é o que está marcado hoje na ficha. */
export interface EscolhaNoNivel {
  tipo: 'subclasse' | 'atributo' | 'classe'
  rotulo: string
  valor: string | null
  /** O nível já chegou, mas a escolha não foi feita. */
  pendente: boolean
}

export interface NoDaArvore {
  nivel: number
  estado: EstadoDoNo
  caracteristicas: HabilidadeDeClasse[]
  escolhas: EscolhaNoNivel[]
}

export interface RamoDaArvore {
  id: string
  nome: string
  ativo: boolean
  nos: NoDaArvore[]
}

export interface ArvoreDeEvolucao {
  classe: string
  nivel: number
  tronco: NoDaArvore[]
  /** Antes da subclasse: todos. Depois: só o ramo escolhido. */
  ramos: RamoDaArvore[]
  /** Quantas subclasses ficaram de fora quando já há uma escolhida. */
  outrasSubclasses: number
}

function estadoDo(nivel: number, atual: number): EstadoDoNo {
  if (nivel < atual) return 'liberado'
  if (nivel === atual) return 'atual'
  return nivel === atual + 1 ? 'proximo' : 'futuro'
}

function porNivel<T extends { nivel: number }>(lista: T[]): Map<number, T[]> {
  const mapa = new Map<number, T[]>()
  for (const x of lista) mapa.set(x.nivel, [...(mapa.get(x.nivel) ?? []), x])
  return mapa
}

function escolhaDeClasse(p: Personagem, e: EscolhaDeClasse): EscolhaNoNivel {
  const id = p.escolhasDeClasse?.[e.id]
  const opcao = e.opcoes.find((o) => o.id === id)
  return { tipo: 'classe', rotulo: e.rotulo, valor: opcao?.nome ?? id ?? null, pendente: e.nivel <= p.nivel && !id }
}

function textoDoIncremento(p: Personagem, nivel: number): string | null {
  const inc = p.incrementos.find((i) => i.nivel === nivel)
  if (!inc) return null
  if (inc.talento) return TALENTO_POR_ID[inc.talento.id]?.nome ?? inc.talento.id
  const partes = ATRIBUTOS.filter((a) => inc.aumentos[a.id]).map((a) => `+${inc.aumentos[a.id]} ${a.abrev}`)
  return partes.length ? partes.join(' ') : null
}

/** O mapa de evolução de 1 a 20, só com o que o catálogo da classe e a ficha já dizem. */
export function montarArvore(p: Personagem): ArvoreDeEvolucao {
  const classe = obterClasse(p.classeId)
  const subclasse = obterSubclasse(classe, p.subclasseId)
  const caracteristicas = porNivel(classe.habilidades)
  const escolhasDaClasse = porNivel(classe.escolhas ?? [])

  const tronco: NoDaArvore[] = []
  for (let nivel = 1; nivel <= 20; nivel++) {
    const escolhas: EscolhaNoNivel[] = (escolhasDaClasse.get(nivel) ?? []).map((e) => escolhaDeClasse(p, e))
    if (nivel === classe.nivelSubclasse) {
      escolhas.unshift({ tipo: 'subclasse', rotulo: classe.nomeSubclasse, valor: subclasse?.nome ?? null, pendente: nivel <= p.nivel && !subclasse })
    }
    if (classe.niveisIncremento.includes(nivel)) {
      const valor = nivel <= p.nivel ? textoDoIncremento(p, nivel) : null
      escolhas.push({ tipo: 'atributo', rotulo: 'Aumento de atributo ou talento', valor, pendente: nivel <= p.nivel && !valor })
    }
    tronco.push({ nivel, estado: estadoDo(nivel, p.nivel), caracteristicas: caracteristicas.get(nivel) ?? [], escolhas })
  }

  const montarRamo = (id: string): RamoDaArvore => {
    const s = classe.subclasses.find((x) => x.id === id)!
    const doRamo = porNivel(s.habilidades)
    const escolhasDoRamo = porNivel(s.escolhas ?? [])
    const niveis = [...new Set([...doRamo.keys(), ...escolhasDoRamo.keys()])].sort((a, b) => a - b)
    return {
      id: s.id,
      nome: s.nome,
      ativo: s.id === p.subclasseId,
      nos: niveis.map((nivel) => ({
        nivel,
        estado: estadoDo(nivel, p.nivel),
        caracteristicas: doRamo.get(nivel) ?? [],
        escolhas: (escolhasDoRamo.get(nivel) ?? []).map((e) => escolhaDeClasse(p, e)),
      })),
    }
  }

  const ramos = subclasse ? [montarRamo(subclasse.id)] : classe.subclasses.map((s) => montarRamo(s.id))
  return { classe: classe.nome, nivel: p.nivel, tronco, ramos, outrasSubclasses: subclasse ? classe.subclasses.length - 1 : 0 }
}
