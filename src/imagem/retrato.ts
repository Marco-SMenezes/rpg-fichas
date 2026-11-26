/**
 * Foto do personagem: reduzida no próprio aparelho antes de salvar, para caber
 * no armazenamento do navegador e sincronizar rápido (uns 30–80 KB).
 */

/** Lado maior da foto salva, em pixels. */
export const LADO_MAXIMO = 480

/** Novo tamanho mantendo a proporção, sem aumentar fotos pequenas. */
export function tamanhoReduzido(largura: number, altura: number, maximo = LADO_MAXIMO): { largura: number; altura: number } {
  if (largura <= 0 || altura <= 0) return { largura: 0, altura: 0 }
  const escala = Math.min(1, maximo / Math.max(largura, altura))
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) }
}

/** Aceita só imagens guardadas como data URL (o que o Tomo mesmo gera). */
export function retratoValido(x: unknown): x is string {
  return typeof x === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x) && x.length < 1_500_000
}

/** Lê o arquivo escolhido, reduz e devolve um JPEG em data URL. */
export async function lerRetrato(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.')
  const bitmap = await createImageBitmap(arquivo).catch(() => {
    throw new Error('Não deu para abrir essa imagem. Tente JPG ou PNG.')
  })
  const { largura, altura } = tamanhoReduzido(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Seu navegador não conseguiu processar a imagem.')
  ctx.drawImage(bitmap, 0, 0, largura, altura)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}
