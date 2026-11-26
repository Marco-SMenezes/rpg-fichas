/** Ícones simples por tipo de monstro (desenho próprio do Tomo), usados quando o monstro não tem foto. */

const DESENHOS: Record<string, string[]> = {
  // olho com tentáculos
  Aberração: ['M3 10c3-4 15-4 18 0-3 4-15 4-18 0Z', 'M12 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0', 'M7 13c-1 3-3 4-4 7M12 14v6M17 13c1 3 3 4 4 7'],
  // pegada
  Besta: [
    'M12 13c-3 0-5 2-5 4.5S9 21 12 21s5-1 5-3.5S15 13 12 13Z',
    'M6 9.5a1.6 2 0 1 0 0 .01M18 9.5a1.6 2 0 1 0 0 .01M9.5 6a1.6 2 0 1 0 0 .01M14.5 6a1.6 2 0 1 0 0 .01',
  ],
  // auréola e brilho
  Celestial: ['M5 5.5c0-1.5 3-2.5 7-2.5s7 1 7 2.5S16 8 12 8 5 7 5 5.5Z', 'M12 10v11M7 15.5h10M8.5 12l7 7M15.5 12l-7 7'],
  // cabeça de autômato
  Constructo: ['M6 8h12v11H6Z', 'M12 8V5M12 3.5h.01', 'M9.5 12.5h.01M14.5 12.5h.01', 'M9.5 16h5', 'M4 12v3M20 12v3'],
  // cabeça de dragão com chifre
  Dragão: ['M3 17c2-6 7-10 13-9l5 2.5-3.5 1 2.5 3-6-1c-1.5 3-5 5-11 3.5Z', 'M11 8.5 9 3.5l4.5 4', 'M15 11h.01'],
  // chama
  Elemental: [
    'M12 21c-4 0-6.5-2.7-6.5-6 0-4 3.5-6 4-10 2.5 2 3 4 3 6 1-1 1.5-2 1.5-3.5 2 2 4.5 4.5 4.5 7.5 0 3.3-2.5 6-6.5 6Z',
    'M12 21c-1.7 0-3-1.2-3-3 0-2 2-3 2.5-5 1.5 1.5 3.5 3 3.5 5 0 1.8-1.3 3-3 3Z',
  ],
  // borboleta
  Fada: [
    'M12 7v13',
    'M12 10C9 5 3 5 4 9s5 4 8 3M12 10c3-5 9-5 8-1s-5 4-8 3',
    'M12 13c-3 0-6 2-5 5s4 1 5-2M12 13c3 0 6 2 5 5s-4 1-5-2',
    'M10.5 5 9 3M13.5 5 15 3',
  ],
  // cabeça com chifres
  Corruptor: [
    'M7 9c-3-1-4-4-3-6 1 2 3 3 5 3M17 9c3-1 4-4 3-6-1 2-3 3-5 3',
    'M6 11c0-3 2.7-5 6-5s6 2 6 5v2c0 4-3 8-6 8s-6-4-6-8Z',
    'M9.5 12.5h.01M14.5 12.5h.01M10 17c1.2.8 2.8.8 4 0',
  ],
  // clava
  Gigante: ['M5 20 13 12', 'M13 12c-1-3 1-8 5-9 2 1 3 3 2 5-1 3-4 5-7 4Z', 'M15.5 5.5h.01M18 9h.01M14.5 9.5h.01'],
  // busto
  Humanoide: ['M12 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 1 0 0-7Z', 'M4.5 20c0-4 3.4-7 7.5-7s7.5 3 7.5 7'],
  // marcas de garra
  Monstruosidade: ['M6 4c1 6 2 11 0 16', 'M11 3c1.5 6 2 12 0 18', 'M16 4c1.5 6 2 11 0 16', 'M20 6c.8 4 1 8 0 12'],
  // gosma
  Limo: ['M4 18c-1-4 1-9 5-11 3-1.5 6-1.5 8 0 3 2 4 6 3 10-.5 2-2 3-4 3H8c-2 0-3.5-.7-4-2Z', 'M9 12.5h.01M14 11.5h.01', 'M8 20v1.5M15 20v2'],
  // folha
  Planta: ['M5 19C4 10 9 4 20 4c0 10-5 16-14 15Z', 'M5 19 15 9'],
  // caveira
  'Morto-vivo': [
    'M12 3c-4.4 0-7 3-7 7 0 2.4 1 4 2.5 5v3h9v-3c1.5-1 2.5-2.6 2.5-5 0-4-2.6-7-7-7Z',
    'M9.3 10.5a1.3 1.3 0 1 0 0 .01M14.7 10.5a1.3 1.3 0 1 0 0 .01',
    'M10.5 18v3M13.5 18v3M11.3 14h1.4',
  ],
}

export function temIconeDeTipo(tipo: string | null | undefined): boolean {
  return !!tipo && tipo in DESENHOS
}

export function IconeDeMonstro({ tipo, tamanho = 24 }: { tipo: string | null | undefined; tamanho?: number }) {
  const caminhos = (tipo && DESENHOS[tipo]) || DESENHOS['Monstruosidade']!
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {caminhos.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}

/** Foto do monstro, ou o ícone do tipo quando não há foto. */
export function RetratoDeMonstro({
  foto,
  tipo,
  nome,
  tamanho = 48,
}: {
  foto?: string | null | undefined
  tipo: string | null | undefined
  nome: string
  tamanho?: number
}) {
  const estilo = { inlineSize: tamanho, blockSize: tamanho }
  if (foto) return <img className="retrato" src={foto} alt={`Imagem de ${nome}`} style={estilo} />
  return (
    <span className="retrato retrato--vazio retrato--monstro" style={estilo} title={tipo ?? undefined} aria-hidden="true">
      <IconeDeMonstro tipo={tipo} tamanho={Math.round(tamanho * 0.62)} />
    </span>
  )
}
