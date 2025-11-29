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
