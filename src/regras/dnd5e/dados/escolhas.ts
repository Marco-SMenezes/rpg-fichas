import type { EscolhaDeClasse } from '../tipos'

type Opcao = EscolhaDeClasse['opcoes'][number]

/**
 * Várias escolhas da mesma lista (manobras, metamagia, disciplinas…), uma por vaga.
 * `niveis` diz em que nível cada vaga abre; os ids ficam `prefixo1`, `prefixo2`…
 */
export function escolhasEmSerie(prefixo: string, rotulo: string, pagina: number, niveis: number[], opcoes: Opcao[]): EscolhaDeClasse[] {
  return niveis.map((nivel, i) => ({
    id: `${prefixo}${i + 1}`,
    nivel,
    rotulo: `${rotulo} ${i + 1}`,
    pagina,
    opcoes,
  }))
}

/** Nomes escolhidos numa série, para mostrar na ficha. */
export function escolhidosDaSerie(prefixo: string, escolhas: Record<string, string>, opcoes: Opcao[]): string {
  const nomes = Object.entries(escolhas)
    .filter(([k, v]) => v && k.replace(/\d+$/, '') === prefixo)
    .sort(([a], [b]) => Number(a.slice(prefixo.length)) - Number(b.slice(prefixo.length)))
    .map(([, v]) => opcoes.find((o) => o.id === v)?.nome ?? v)
  return nomes.join(', ') || '—'
}

/** Valores escolhidos numa série (sem vazios). */
export function valoresDaSerie(prefixo: string, escolhas: Record<string, string>): string[] {
  return Object.entries(escolhas)
    .filter(([k, v]) => v && k.replace(/\d+$/, '') === prefixo)
    .map(([, v]) => v)
}
