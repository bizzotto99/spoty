/**
 * Funciones para interactuar con la tabla de playlists en Supabase
 */

import { supabase } from './supabase'

export interface PlaylistData {
  spotify_playlist_id: string
  user_id: string
}

/**
 * Crea una nueva playlist en la base de datos
 */
export async function createPlaylist(playlistData: PlaylistData) {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      spotify_playlist_id: playlistData.spotify_playlist_id,
      user_id: playlistData.user_id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creando playlist:', error)
    throw error
  }

  return data
}

/**
 * Obtiene todas las playlists de un usuario por su user_id (UUID)
 */
export async function getUserPlaylists(userId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo playlists:', error)
    throw error
  }

  return data || []
}

/**
 * Obtiene todas las playlists de un usuario por su spotify_user_id
 */
export async function getUserPlaylistsBySpotifyId(spotifyUserId: string) {
  // Primero obtener el user_id desde la tabla users
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('spotify_user_id', spotifyUserId)
    .single()

  if (userError || !user) {
    console.error('Error obteniendo usuario:', userError)
    throw userError || new Error('Usuario no encontrado')
  }

  // Luego obtener las playlists
  return getUserPlaylists(user.id)
}
