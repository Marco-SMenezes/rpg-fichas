/**
 * Supabase de mentira para os testes no navegador. Atende às chamadas REST
 * (tabelas e rpc) e de login em memória, por página. O realtime fica mudo.
 * Nada aqui chega ao projeto de verdade.
 */
import type { Page, Route } from '@playwright/test'

type Linha = Record<string, unknown>

export const EU = '00000000-0000-0000-0000-00000000000a'
export const OUTRO = '00000000-0000-0000-0000-00000000000b'
const PROJETO = 'msvdwmrpzgyexjmcxsje'
const EMAIL = 'mestre@exemplo.com'

export interface OpcoesDaNuvem {
  /** Começa com a sessão aberta. Padrão: true. */
  logado?: boolean
  /** Conta aprovada pelo dono do Tomo. Padrão: true. */
  aprovado?: boolean
  campanhas?: Partial<Linha>[]
  membros?: Partial<Linha>[]
  /** Combate aberto de uma campanha, com as linhas dos participantes. */
  combates?: Partial<Linha>[]
  participantes?: Partial<Linha>[]
}

const base64url = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (sub: string) =>
  `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ sub, role: 'authenticated', exp: 4102444800, email: EMAIL })}.assinatura`
const usuario = { id: EU, email: EMAIL, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { nome: 'Mestre' } }
const sessao = () => ({
  access_token: jwt(EU),
  refresh_token: 'renovar',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 4102444800,
  user: usuario,
})

export function campanha(dados: Partial<Linha> = {}): Linha {
  return {
    id: `c-${Math.random().toString(36).slice(2, 8)}`,
    nome: 'A Mina Perdida',
    mestre: EU,
    codigo: 'K7M2QX',
    notas: '',
    sistema: 'dnd5e',
    tema: 'Fantasia',
    descricao: '',
    imagem: null,
    criado_em: new Date().toISOString(),
    ...dados,
  }
}

/** Linha de participante de combate (jogador por padrão, vivo e sem iniciativa). */
export function participante(dados: Partial<Linha> = {}): Linha {
  return {
    id: `p-${Math.random().toString(36).slice(2, 8)}`,
    combate_id: 'cb1',
    tipo: 'jogador',
    personagem_id: null,
    usuario: EU,
    nome: 'Bruna',
    resumo: 'Humano · Guerreiro 1',
    foto: null,
    iniciativa: 10,
    desempate: 0,
    pv: 12,
    pv_max: 12,
    pv_temp: 0,
    morte_sucessos: 0,
    morte_falhas: 0,
    condicoes: [],
    ca: 16,
    ...dados,
  }
}

export class NuvemSimulada {
  readonly tabelas: Record<string, Linha[]> = {}
  readonly chamadas: string[] = []
  aprovado: boolean

  constructor(opcoes: OpcoesDaNuvem = {}) {
    this.aprovado = opcoes.aprovado ?? true
    this.tabelas.campanhas = (opcoes.campanhas ?? []).map((c) => campanha(c))
    this.tabelas.membros = (opcoes.membros ?? []).map((m) => ({ apelido: '', personagem_id: null, ...m }))
    this.tabelas.combates = (opcoes.combates ?? []).map((c) => ({ id: 'cb1', campanha_id: 'c1', rodada: 1, vez: null, ...c }))
    this.tabelas.participantes = (opcoes.participantes ?? []).map((x) => participante(x))
  }

  tabela(nome: string): Linha[] {
    return (this.tabelas[nome] ??= [])
  }

  private rpc(nome: string, args: Linha): { status: number; corpo: unknown } {
    switch (nome) {
      case 'minha_conta':
        return { status: 200, corpo: [{ aprovado: this.aprovado, admin: false, pendentes: 0 }] }
      case 'entrar_na_campanha': {
        const c = this.tabela('campanhas').find((x) => x.codigo === args.p_codigo)
        if (!c) return { status: 400, corpo: { code: 'P0001', message: 'Código não encontrado' } }
        if (!this.tabela('membros').some((m) => m.campanha_id === c.id && m.usuario === EU))
          this.tabela('membros').push({ campanha_id: c.id, usuario: EU, apelido: args.p_apelido, personagem_id: null })
        return { status: 200, corpo: c.id }
      }
      case 'mesa_da_campanha':
        return {
          status: 200,
          corpo: this.tabela('membros')
            .filter((m) => m.campanha_id === args.c)
            .map((m) => ({
              usuario: m.usuario,
              apelido: m.apelido,
              personagem_id: m.personagem_id,
              personagem_nome: null,
              raca: null,
              classe: null,
              nivel: null,
              sistema: null,
              modelo_nome: null,
            })),
        }
      default:
        return { status: 200, corpo: null }
    }
  }

  /** Filtros do PostgREST que o app usa: col=eq.valor e col=is.null. */
  private filtrar(linhas: Linha[], busca: URLSearchParams): Linha[] {
    let r = linhas
    for (const [col, valor] of busca) {
      if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(col)) continue
      const [op, ...resto] = valor.split('.')
      const alvo = resto.join('.')
      if (op === 'eq') r = r.filter((l) => String(l[col]) === alvo)
      else if (op === 'is' && alvo === 'null') r = r.filter((l) => l[col] == null)
      else if (op === 'in') {
        const lista = alvo
          .replace(/^\(|\)$/g, '')
          .split(',')
          .map((s) => s.replace(/^"|"$/g, ''))
        r = r.filter((l) => lista.includes(String(l[col])))
      }
    }
    return r
  }

  private rest(metodo: string, nome: string, busca: URLSearchParams, corpo: unknown, prefer: string): Linha[] {
    const tabela = this.tabela(nome)
    if (metodo === 'GET' || metodo === 'HEAD') return this.filtrar(tabela, busca)
    if (metodo === 'POST') {
      const novas = (Array.isArray(corpo) ? corpo : [corpo]) as Linha[]
      const chave = busca.get('on_conflict')?.split(',') ?? ['id']
      return novas.map((nova) => {
        const existente = /merge-duplicates/.test(prefer) ? tabela.find((l) => chave.every((k) => l[k] === nova[k])) : undefined
        if (existente) return Object.assign(existente, nova)
        const linha = nome === 'campanhas' ? campanha({ mestre: EU, ...nova }) : { id: `id-${tabela.length + 1}`, ...nova }
        tabela.push(linha)
        return linha
      })
    }
    if (metodo === 'PATCH') return this.filtrar(tabela, busca).map((l) => Object.assign(l, corpo))
    if (metodo === 'DELETE') {
      const fora = this.filtrar(tabela, busca)
      this.tabelas[nome] = tabela.filter((l) => !fora.includes(l))
      return fora
    }
    return []
  }

  async atender(route: Route) {
    const pedido = route.request()
    const url = new URL(pedido.url())
    const metodo = pedido.method()
    const caminho = url.pathname
    this.chamadas.push(`${metodo} ${caminho.replace(/^\/(rest|auth)\/v1\//, '')}`)
    const json = (status: number, corpo: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(corpo) })

    if (caminho.startsWith('/auth/v1/')) {
      if (caminho.endsWith('/user')) return json(200, usuario)
      if (caminho.endsWith('/token') || caminho.endsWith('/signup')) return json(200, sessao())
      if (caminho.endsWith('/logout')) return route.fulfill({ status: 204 })
      return json(200, {})
    }

    const corpo = pedido.postData() ? pedido.postDataJSON() : undefined
    if (caminho.startsWith('/rest/v1/rpc/')) {
      const r = this.rpc(caminho.split('/').pop()!, (corpo ?? {}) as Linha)
      return json(r.status, r.corpo)
    }

    if (caminho.startsWith('/rest/v1/')) {
      const linhas = this.rest(metodo, caminho.split('/').pop()!, url.searchParams, corpo, pedido.headers()['prefer'] ?? '')
      if ((pedido.headers()['accept'] ?? '').includes('vnd.pgrst.object')) {
        if (linhas.length !== 1)
          return json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: '', hint: null })
        return json(200, linhas[0])
      }
      return json(200, linhas)
    }

    return route.fulfill({ status: 404, body: '' })
  }
}

/** Liga a nuvem simulada na página. Chame antes do primeiro goto. */
export async function ligarNuvem(page: Page, opcoes: OpcoesDaNuvem = {}): Promise<NuvemSimulada> {
  const nuvem = new NuvemSimulada(opcoes)
  await page.route(/\.supabase\.co\//, (route) => nuvem.atender(route))
  await page.routeWebSocket(/\.supabase\.co\//, () => {})
  if (opcoes.logado ?? true)
    await page.addInitScript(
      ([chave, valor]) => {
        if (!localStorage.getItem(chave)) localStorage.setItem(chave, valor)
      },
      [`sb-${PROJETO}-auth-token`, JSON.stringify(sessao())] as const,
    )
  return nuvem
}

/** Falha o teste se a página lançar um erro de JavaScript. */
export function vigiarErros(page: Page): string[] {
  const erros: string[] = []
  page.on('pageerror', (e) => erros.push(e.message))
  return erros
}
