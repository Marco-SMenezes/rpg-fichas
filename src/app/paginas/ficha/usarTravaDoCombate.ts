import { useEffect, useState } from 'react'
import { fichaTravadaPeloCombate } from '../../../combate/morte'
import { meusParticipantes } from '../../../nuvem/combate'
import { situacaoDaMorte } from '../../../regras/dnd5e/motor/progressao'
import type { Personagem } from '../../../regras/dnd5e/tipos'
import { useNuvem } from '../../estado'

const A_CADA = 15_000

/**
 * A ficha está travada: morta (três falhas) enquanto tem uma linha de jogador num combate. Pergunta à nuvem quando a
 * ficha morre, ao voltar para a aba e de tempos em tempos, para destravar sozinha quando o combate acaba ou o mestre a
 * tira dele. Sem conta ou sem rede, não trava: só se sabe que há combate com a nuvem, e o último resultado fica.
 */
export function useFichaTravada(p: Personagem): boolean {
  const nuvem = useNuvem()
  const morta = situacaoDaMorte(p) === 'morto'
  const ativa = nuvem.status === 'logado' && nuvem.aprovado === true
  const [travada, setTravada] = useState(false)

  useEffect(() => {
    if (!morta || !ativa) {
      setTravada(false)
      return
    }
    let vivo = true
    const checar = async () => {
      try {
        const linhas = await meusParticipantes()
        if (vivo) setTravada(fichaTravadaPeloCombate(p, linhas))
      } catch {
        // Sem rede: mantém o que já se sabia.
      }
    }
    void checar()
    const relogio = setInterval(() => void checar(), A_CADA)
    window.addEventListener('focus', checar)
    return () => {
      vivo = false
      clearInterval(relogio)
      window.removeEventListener('focus', checar)
    }
  }, [morta, ativa, p.id])

  return morta && ativa && travada
}
