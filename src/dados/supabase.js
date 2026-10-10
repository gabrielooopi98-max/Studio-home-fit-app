import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

// Sem as variáveis o app mostra uma tela explicando a configuração em vez de quebrar.
export const supabaseConfigurado = Boolean(url && chave)

export const supabase = supabaseConfigurado
  ? createClient(url, chave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null
