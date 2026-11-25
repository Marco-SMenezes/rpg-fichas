/** Preferências de aparência: modo claro/escuro e cor de destaque. */

export type Modo = 'sistema' | 'claro' | 'escuro'

export interface PreferenciasTema {
  modo: Modo
  acento: string
}

export const ACENTO_PADRAO = '#d0783f'
export const PREFERENCIAS_PADRAO: PreferenciasTema = { modo: 'sistema', acento: ACENTO_PADRAO }

/** Cores prontas para o destaque. */
export const CORES: { nome: string; hex: string }[] = [
  { nome: 'Cobre', hex: '#d0783f' },
  { nome: 'Âmbar', hex: '#d99a1e' },
  { nome: 'Ouro', hex: '#b8a01f' },
  { nome: 'Oliva', hex: '#7f9a2a' },
  { nome: 'Musgo', hex: '#4f9a4a' },
  { nome: 'Esmeralda', hex: '#1f9e6e' },
  { nome: 'Turquesa', hex: '#1a9fa0' },
  { nome: 'Céu', hex: '#2f8fd0' },
  { nome: 'Anil', hex: '#4a6fe0' },
  { nome: 'Índigo', hex: '#6a5ad6' },
  { nome: 'Ametista', hex: '#9452cc' },
  { nome: 'Orquídea', hex: '#c24fb6' },
  { nome: 'Rosa', hex: '#d9487f' },
  { nome: 'Carmim', hex: '#d03a4a' },
  { nome: 'Vermelho', hex: '#d64a32' },
  { nome: 'Ardósia', hex: '#6f7f94' },
  { nome: 'Areia', hex: '#a88f6e' },
  { nome: 'Grafite', hex: '#8a8d93' },
]

export function normalizarHex(cor: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(cor.trim())
  if (!m) return null
  const h = m[1]!.toLowerCase()
  return `#${h.length === 3 ? [...h].map((c) => c + c).join('') : h}`
}

/** Luminância relativa (WCAG). */
export function luminancia(hex: string): number {
  const h = normalizarHex(hex) ?? '#000000'
  const canais = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number]
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Texto sobre o botão na cor de destaque: branco ou quase preto, o que contrastar mais. */
export function textoSobre(hex: string): string {
  return contraste(hex, '#ffffff') >= contraste(hex, '#16181d') ? '#ffffff' : '#16181d'
}

export function resolverModo(modo: Modo, sistemaEscuro: boolean): 'claro' | 'escuro' {
  if (modo === 'sistema') return sistemaEscuro ? 'escuro' : 'claro'
  return modo
}

export function lerPreferencias(bruto: string | null): PreferenciasTema {
  try {
    const p = bruto ? (JSON.parse(bruto) as Partial<PreferenciasTema>) : {}
    return {
      modo: p.modo === 'claro' || p.modo === 'escuro' || p.modo === 'sistema' ? p.modo : PREFERENCIAS_PADRAO.modo,
      acento: (typeof p.acento === 'string' && normalizarHex(p.acento)) || ACENTO_PADRAO,
    }
  } catch {
    return PREFERENCIAS_PADRAO
  }
}
