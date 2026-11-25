import { describe, expect, it } from 'vitest'
import { criarPersonagem } from '../regras/dnd5e/motor/criacao'
import { duplicarPersonagem, excluirPersonagem, exportar, importar, listarPersonagens, salvarPersonagem, type Armazem } from './personagens'

const memoria = (): Armazem => {
  const dados = new Map<string, string>()
  return { getItem: (c) => dados.get(c) ?? null, setItem: (c, v) => void dados.set(c, v) }
}

const pj = () =>
  criarPersonagem({
    nome: 'Lia',
    conceito: '',
    jogador: '',
    racaId: 'elfo',
    subracaId: 'elfo-floresta',
    classeId: 'ladino',
    antecedenteId: 'criminoso',
    metodoAtributos: 'padrao',
    atributosBase: { for: 8, des: 15, con: 14, int: 12, sab: 13, car: 10 },
    periciasEscolhidas: ['acrobacia', 'investigacao', 'prestidigitacao', 'intuicao'],
    especializacoes: ['furtividade', 'prestidigitacao'],
    ferramentasEscolhidas: [],
    idiomasEscolhidos: [],
    equipamento: {},
  })

describe('armazenamento local', () => {
  it('salva, lista, atualiza e exclui', () => {
    const a = memoria()
    const p = salvarPersonagem(pj(), a)
    expect(listarPersonagens(a)).toHaveLength(1)
    salvarPersonagem({ ...p, nome: 'Lia Folha' }, a)
    expect(listarPersonagens(a)[0]!.nome).toBe('Lia Folha')
    excluirPersonagem(p.id, a)
    expect(listarPersonagens(a)).toHaveLength(0)
  })

  it('ignora dados corrompidos', () => {
    const a = memoria()
    a.setItem('tomo:personagens:v1', '{quebrado')
    expect(listarPersonagens(a)).toEqual([])
  })

  it('duplicar gera id novo e marca a cópia', () => {
    const p = pj()
    const c = duplicarPersonagem(p)
    expect(c.id).not.toBe(p.id)
    expect(c.nome).toBe('Lia (cópia)')
  })
})

describe('exportar e importar', () => {
  it('ida e volta preserva a ficha', () => {
    const p = pj()
    const r = importar(exportar([p]), [])
    expect(r.ok && r.personagens[0]).toEqual(p)
  })
  it('id repetido ganha id novo', () => {
    const p = pj()
    const r = importar(exportar([p]), [p])
    expect(r.ok && r.personagens[0]!.id).not.toBe(p.id)
  })
  it('aceita um personagem solto', () => {
    const r = importar(JSON.stringify(pj()), [])
    expect(r.ok).toBe(true)
  })
  it('recusa arquivo inválido', () => {
    expect(importar('nada', [])).toEqual({ ok: false, erro: 'O arquivo não é um JSON válido.' })
    expect(importar('{"a":1}', []).ok).toBe(false)
  })
})
