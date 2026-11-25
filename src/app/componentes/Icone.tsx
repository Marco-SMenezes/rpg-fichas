const CAMINHOS = {
  d20: 'M12 2.5 20.5 7.25v9.5L12 21.5l-8.5-4.75v-9.5Zm0 0v6.25m0 0-8.5-1.5m8.5 1.5 8.5-1.5M12 8.75 7 16.5h10Zm-5 7.75-3.5.25M17 16.5l3.5.25M12 21.5 7 16.5m5 5 5-5',
  mais: 'M12 5v14M5 12h14',
  menos: 'M5 12h14',
  voltar: 'M15 5l-7 7 7 7',
  avancar: 'M9 5l7 7-7 7',
  fechar: 'M6 6l12 12M18 6 6 18',
  copiar: 'M9 9h10v10H9zM5 15V5h10',
  lixo: 'M4 7h16M10 11v6m4-6v6M6 7l1 12h10l1-12M9 7V4h6v3',
  baixar: 'M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14',
  subir: 'M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 19h14',
  mais_opcoes: 'M12 6h.01M12 12h.01M12 18h.01',
  lua: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
  fogueira: 'M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-7ZM5 20l14-3M5 17l14 3',
  estrela: 'M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9Z',
  seta_cima: 'M12 19V5m0 0-6 6m6-6 6 6',
  historico: 'M4 12a8 8 0 1 0 2.35-5.65M4 4v4h4M12 8v4l3 2',
} as const

export type NomeIcone = keyof typeof CAMINHOS

export function Icone({ nome, tamanho = 20, preenchido = false }: { nome: NomeIcone; tamanho?: number; preenchido?: boolean }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={preenchido ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={nome === 'mais_opcoes' ? 3 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={CAMINHOS[nome]} />
    </svg>
  )
}
