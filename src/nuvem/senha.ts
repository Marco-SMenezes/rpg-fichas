/**
 * Regra de senha das contas novas. Tem de bater com o painel do Supabase
 * (Authentication → Email: mínimo 8, com minúscula, maiúscula e número).
 * O Supabase só conta letras sem acento (a-z, A-Z).
 */
export const MINIMO_DA_SENHA = 8

export const REGRA_DA_SENHA = `Pelo menos ${MINIMO_DA_SENHA} caracteres, com letra maiúscula, minúscula e número.`

/** O que falta na senha, ou null se ela já serve. */
export function problemaNaSenha(senha: string): string | null {
  const falta = [
    !/[A-Z]/.test(senha) && 'uma letra maiúscula',
    !/[a-z]/.test(senha) && 'uma letra minúscula',
    !/[0-9]/.test(senha) && 'um número',
  ].filter(Boolean)
  if (senha.length < MINIMO_DA_SENHA) return `A senha precisa ter pelo menos ${MINIMO_DA_SENHA} caracteres.`
  if (falta.length) return `Falta ${falta.length > 1 ? `${falta.slice(0, -1).join(', ')} e ${falta.at(-1)}` : falta[0]} na senha.`
  return null
}
