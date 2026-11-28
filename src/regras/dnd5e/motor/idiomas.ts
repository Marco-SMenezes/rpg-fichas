/**
 * Listas de idiomas à escolha (antecedente, raça, Domínio do Conhecimento, Linguista) não oferecem o que o
 * personagem já fala. A opção já marcada na própria lista continua, para a escolha não sumir da tela.
 */
export function semIdiomasConhecidos<T extends { id: string }>(opcoes: T[], conhecidos: readonly string[], atual?: string): T[] {
  return opcoes.filter((o) => o.id === atual || !conhecidos.includes(o.id))
}
