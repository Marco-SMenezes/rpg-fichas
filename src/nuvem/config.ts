/**
 * Configuração do Supabase (Etapa 2). A URL do projeto e a chave anon/publishable
 * são públicas: vão dentro do site. Quem protege os dados são as regras de RLS
 * em supabase/migrations. Nunca coloque aqui a chave service_role/secret.
 *
 * Também dá para definir por variável de ambiente no build:
 * VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
 */
const URL_DO_PROJETO = 'https://msvdwmrpzgyexjmcxsje.supabase.co'
const CHAVE_PUBLICA = 'sb_publishable_lmqwUzlRK1uNX3TrZZaTnQ_HjrkrAyD'

export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || URL_DO_PROJETO
export const SUPABASE_CHAVE: string = import.meta.env.VITE_SUPABASE_ANON_KEY || CHAVE_PUBLICA

export const nuvemConfigurada = Boolean(SUPABASE_URL && SUPABASE_CHAVE)

/**
 * Login por código no e-mail. Só funciona para todos com um servidor de e-mail
 * próprio (SMTP) configurado no Supabase; o padrão só entrega para membros da
 * organização. Enquanto isso, o login é por e-mail e senha.
 */
export const codigoPorEmail = false
