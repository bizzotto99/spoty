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
