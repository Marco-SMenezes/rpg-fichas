import { describe, expect, it } from 'vitest'
import {
  calcularFichaLivre,
  chaveDe,
  chaveLivre,
  expressaoDaRolagem,
  modeloDeExemplo,
  normalizarModelo,
  novoCampo,
  valoresIniciais,
  type Modelo,
} from './modelo'

const campo = (m: Modelo, rotulo: string) => m.campos.find((c) => c.rotulo === rotulo)!

describe('ficha livre', () => {
  it('chaves a partir do nome, sem repetir', () => {
    expect(chaveDe('Força de Vontade')).toBe('forca_de_vontade')
    expect(chaveDe('2ª Ação')).toBe('c_2_acao')
    const m = modeloDeExemplo()
    expect(chaveLivre(m, 'forca')).toBe('forca_2')
    expect(chaveLivre(m, 'sorte')).toBe('sorte')
  })

  it('o modelo de exemplo calcula defesa, máximos e rolagens', () => {
    const m = modeloDeExemplo()
    const v = valoresIniciais(m)
    const calc = calcularFichaLivre(m, v)
    expect(calc.erros).toEqual({})
    expect(calc.porChave.defesa).toBe(10 + 1 + 1)
    expect(calc.expressoes[campo(m, 'Vida').id]).toBe(10 + 2 + 3)
    expect(v[campo(m, 'Vida').id]).toBe(15)
    expect(expressaoDaRolagem(campo(m, 'Teste de Força'), calc)).toBe('1d20+1')
  })

  it('fórmula que usa outra fórmula; valores mudam o resultado', () => {
    const m = modeloDeExemplo()
    const bonus = { ...novoCampo(m, 'formula', 'Principal', 'Bônus'), expressao: 'defesa - 10' }
    m.campos.push(bonus)
    const v = { ...valoresIniciais(m), [campo(m, 'Agilidade').id]: 3 }
    expect(calcularFichaLivre(m, v).porChave.bonus).toBe(3 + 1)
  })

  it('ciclo e campo desconhecido viram erro no campo, sem travar o resto', () => {
    const m = modeloDeExemplo()
    const a = { ...novoCampo(m, 'formula', 'Principal', 'A'), expressao: 'b + 1' }
    m.campos.push(a)
    const b = { ...novoCampo(m, 'formula', 'Principal', 'B'), expressao: 'a + 1' }
    m.campos.push(b)
    const ruim = { ...novoCampo(m, 'formula', 'Principal', 'Ruim'), expressao: 'sorte * 2' }
    m.campos.push(ruim)
    const calc = calcularFichaLivre(m, valoresIniciais(m))
    expect(calc.erros[a.id]).toMatch(/Ciclo/)
    expect(calc.erros[ruim.id]).toMatch(/sorte/)
    expect(calc.porChave.defesa).toBe(12)
  })

  it('rolagem com bônus negativo ou sem dados', () => {
    const m = modeloDeExemplo()
    const r = { ...novoCampo(m, 'rolagem', 'Principal', 'Dano'), dados: '2d6', expressao: '-2' }
    m.campos.push(r)
    expect(expressaoDaRolagem(r, calcularFichaLivre(m, {}))).toBe('2d6-2')
  })

  it('normalizar aguenta lixo', () => {
    expect(normalizarModelo(null)).toBeNull()
    const m = normalizarModelo({ id: 'x', nome: 'Y', campos: [{ id: 'c', tipo: 'numero', rotulo: 'Z', secao: 'sumiu', largura: 5 }, { tipo: 'estranho' }] })
    expect(m?.campos).toHaveLength(1)
    expect(m?.campos[0]).toMatchObject({ chave: 'z', secao: 'Principal', largura: 6 })
  })
})

describe('renomear campo', () => {
  it('atualiza as fórmulas que usavam o nome antigo, sem mexer em nomes parecidos', async () => {
    const { renomearChave } = await import('./modelo')
    const m = modeloDeExemplo()
    const extra = { ...novoCampo(m, 'formula', 'Principal', 'Forca Total'), expressao: 'forca_total_base + forca' }
    m.campos.push(extra)
    const r = renomearChave(m, campo(m, 'Força').id, 'Potência')
    expect(r.campos.find((c) => c.rotulo === 'Força')?.chave).toBe('potencia')
    expect(r.campos.find((c) => c.rotulo === 'Teste de Força')?.expressao).toBe('potencia')
    expect(r.campos.find((c) => c.rotulo === 'Vida')?.expressao).toBe('10 + potencia * 2 + nivel * 3')
    expect(r.campos.find((c) => c.id === extra.id)?.expressao).toBe('forca_total_base + potencia')
  })
})
