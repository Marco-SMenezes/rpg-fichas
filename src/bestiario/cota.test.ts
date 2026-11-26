import { afterEach, describe, expect, it, vi } from 'vitest'

describe('importar sem espaço no aparelho', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('avisa e não deixa monstros só na memória', async () => {
    const guardado = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => guardado.get(k) ?? null,
      setItem: () => {
        throw new DOMException('cheio', 'QuotaExceededError')
      },
      removeItem: (k: string) => guardado.delete(k),
    })
    const { importarMonstros, listarMeusMonstros } = await import('./meus')
    const r = importarMonstros(JSON.stringify({ formato: 'tomo-monstros', versao: 1, monstros: [{ nome: 'Grande demais' }] }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.erro).toMatch(/espaço/)
    expect(listarMeusMonstros()).toHaveLength(0)
  })
})
