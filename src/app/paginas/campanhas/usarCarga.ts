import { useCallback, useEffect, useState } from 'react'

/** Carrega algo da nuvem com estado de espera, erro e "recarregar". */
export function useCarga<T>(carregar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const f = useCallback(carregar, deps)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    try {
      setDados(await f())
      setErro('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Algo deu errado.')
    } finally {
      setCarregando(false)
    }
  }, [f])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  return { dados, setDados, erro, carregando, recarregar }
}
