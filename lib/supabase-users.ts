/**
 * Funciones para interactuar con la tabla de usuarios en Supabase
 */

import { supabase } from './supabase'

/**
 * Obtiene un usuario por su Spotify user ID
 */
export async function getUserBySpotifyId(spotifyUserId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('spotify_user_id', spotifyUserId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error obteniendo usuario:', error)
    throw error
  }

  return data
}

/**
 * Verifica si existe un usuario por su email
 */
export async function userExistsByEmail(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error verificando usuario por email:', error)
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Error en userExistsByEmail:', error)
    return false
  }
}

/**
 * Crea o actualiza un usuario (upsert)
 */
export async function upsertUser(userData: {
  email: string
  spotify_user_id: string
  label_record_id?: string | null
}) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          email: userData.email,
          spotify_user_id: userData.spotify_user_id,
          label_record_id: userData.label_record_id || null,
        },
        {
          onConflict: 'email',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error haciendo upsert de usuario:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error en upsertUser:', error)
    throw error
  }
}

/**
 * Obtiene un usuario por su email
 */
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error obteniendo usuario por email:', error)
    throw error
  }

  return data
}
