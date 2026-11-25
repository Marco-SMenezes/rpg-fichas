import { obterClasse, obterRaca, obterSubclasse, obterSubraca } from '../regras/dnd5e/dados'
import type { Personagem } from '../regras/dnd5e/tipos'

export function resumoPersonagem(p: Personagem): string {
  const raca = obterRaca(p.racaId)
  const subraca = obterSubraca(raca, p.subracaId)
  const classe = obterClasse(p.classeId)
  const subclasse = obterSubclasse(classe, p.subclasseId)
  return `${subraca?.nome ?? raca.nome} · ${classe.nome}${subclasse ? ` (${subclasse.nome})` : ''} ${p.nivel}`
}

export function baixarArquivo(nome: string, conteudo: string) {
  const blob = new Blob([conteudo], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function nomeDeArquivo(texto: string): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'personagem'
  )
}

const formatador = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
export const formatarNumero = (n: number) => formatador.format(n)
