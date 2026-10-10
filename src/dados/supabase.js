import { createClient } from '@supabase/supabase-js'

// Copiar e colar as chaves costuma trazer espaço ou quebra de linha junto (no .env ou na Vercel):
// limpa isso e também o "/rest/v1/" que às vezes vem colado no endereço.
const limpar = (valor) => String(valor ?? '').trim()
const url = limpar(import.meta.env.VITE_SUPABASE_URL).replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
const chave = limpar(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)

// Sem as variáveis o app mostra uma tela explicando a configuração em vez de quebrar.
export const supabaseConfigurado = Boolean(url && chave)

export const supabase = supabaseConfigurado
  ? createClient(url, chave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null
