/** Texto das entradas do histórico do combate (as entradas vêm do banco, migração 0018). */
import type { Entrada } from '../nuvem/combate'

const pv = (n: number) => `${n} PV`

export function textoDaEntrada(e: Pick<Entrada, 'tipo' | 'nome' | 'de' | 'para' | 'detalhe'>): string {
  switch (e.tipo) {
    case 'rodada':
      return `Rodada ${e.para ?? ''}`.trim()
    case 'vez':
      return `Vez de ${e.nome || 'alguém que saiu'}`
    case 'entrou':
      return `${e.nome} entrou no combate`
    case 'saiu':
      return `${e.nome} saiu do combate`
    case 'vida': {
      const de = e.de ?? 0
      const para = e.para ?? 0
      const dif = para - de
      return `${e.nome}: ${dif < 0 ? `tomou ${-dif} de dano` : `recuperou ${dif}`} (${pv(de)} → ${pv(para)})`
    }
    case 'condicao':
      return `${e.nome} ${e.para ? 'ganhou' : 'perdeu'} a condição ${e.detalhe}`
    case 'morte':
      return `${e.nome}: ${e.detalhe === 'falha' ? 'falha' : 'sucesso'} no teste contra a morte (${e.para ?? 0}/3)`
  }
}
