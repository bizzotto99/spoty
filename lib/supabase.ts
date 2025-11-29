/**
 * Cliente de Supabase
 * Configuración para conectarse a la base de datos
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL o Anon Key no están configurados. Verifica tus variables de entorno.')
}

// Cliente para uso en el servidor (con Row Level Security)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
