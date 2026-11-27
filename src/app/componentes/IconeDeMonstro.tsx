/** Ícones dos tipos de monstro (game-icons.net, CC BY 3.0 — ver iconesDeMonstros.ts), usados quando o monstro não tem foto. */
import { ICONES_DE_MONSTRO, LADO_DOS_ICONES } from './iconesDeMonstros'

export function temIconeDeTipo(tipo: string | null | undefined): boolean {
  return !!tipo && tipo in ICONES_DE_MONSTRO
}

export function IconeDeMonstro({ tipo, tamanho = 24 }: { tipo: string | null | undefined; tamanho?: number }) {
  const icone = (tipo && ICONES_DE_MONSTRO[tipo]) || ICONES_DE_MONSTRO['Monstruosidade']!
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 ${LADO_DOS_ICONES} ${LADO_DOS_ICONES}`}
      aria-hidden="true"
      focusable="false"
      // Desenho fixo do pacote de ícones (não vem de usuário).
      dangerouslySetInnerHTML={{ __html: icone.corpo }}
    />
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
