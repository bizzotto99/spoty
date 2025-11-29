/**
 * Funciones para cachear y obtener artistas y tracks de Dale Play Records en Supabase
 */

import { supabase } from './supabase'
import type { Artist, Track } from './search-daleplay'

const CACHE_DURATION_HOURS = 24

/**
 * Obtiene artistas de Dale Play desde el cache (si no están expirados)
 */
export async function getCachedDalePlayArtists(): Promise<Artist[] | null> {
  try {
    const { data, error } = await supabase
      .from('dale_play_artists_cache')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('popularity', { ascending: false })

    if (error) {
      console.error('Error obteniendo artistas del cache:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    // Convertir datos de cache a formato Artist
    const artists: Artist[] = data.map((item: any) => ({
      id: item.artist_id,
      name: item.artist_name,
      genres: item.genres || [],
      popularity: item.popularity || 0,
      image: item.image_url || undefined,
    }))

    console.log(`✅ Cache hit: ${artists.length} artistas de Dale Play desde Supabase`)
    return artists
  } catch (error) {
    console.error('Error en getCachedDalePlayArtists:', error)
    return null
  }
}

/**
 * Guarda artistas de Dale Play en el cache
 */
export async function saveDalePlayArtistsToCache(artists: Artist[]): Promise<void> {
  try {
    // Primero, limpiar cache expirado
    await supabase
      .from('dale_play_artists_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())

    // Luego, insertar/actualizar los nuevos artistas
    const cacheData = artists.map(artist => ({
      artist_id: artist.id,
      artist_name: artist.name,
      genres: artist.genres || [],
      popularity: artist.popularity || 0,
      image_url: artist.image || null,
      expires_at: new Date(Date.now() + CACHE_DURATION_HOURS * 60 * 60 * 1000).toISOString(),
    }))

    const { error } = await supabase
      .from('dale_play_artists_cache')
      .upsert(cacheData, {
        onConflict: 'artist_id',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Error guardando artistas en cache:', error)
    } else {
      console.log(`✅ Cache guardado: ${artists.length} artistas de Dale Play en Supabase`)
    }
  } catch (error) {
    console.error('Error en saveDalePlayArtistsToCache:', error)
  }
}

/**
 * Obtiene tracks de Dale Play desde el cache (si no están expirados)
 */
export async function getCachedDalePlayTracks(limit?: number): Promise<Track[] | null> {
  try {
    let query = supabase
      .from('dale_play_tracks_cache')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('cached_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo tracks del cache:', error)
      return null
    }

    if (!data || data.length === 0) {
      return null
    }

    // Convertir datos de cache a formato Track
    const tracks: Track[] = data.map((item: any) => ({
      id: item.track_id,
      name: item.track_name,
      artist: item.artist_name,
      album: item.album_name,
      image: item.image_url,
      duration_ms: item.duration_ms,
      preview_url: item.preview_url || undefined,
      uri: item.uri,
    }))

    console.log(`✅ Cache hit: ${tracks.length} tracks de Dale Play desde Supabase`)
    return tracks
  } catch (error) {
    console.error('Error en getCachedDalePlayTracks:', error)
    return null
  }
}

/**
 * Guarda tracks de Dale Play en el cache
 */
export async function saveDalePlayTracksToCache(tracks: Track[]): Promise<void> {
  try {
    // Primero, limpiar cache expirado
    await supabase
      .from('dale_play_tracks_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())

    // Luego, insertar/actualizar los nuevos tracks
    const cacheData = tracks.map(track => ({
      track_id: track.id,
      track_name: track.name,
      artist_name: track.artist,
      album_name: track.album,
      image_url: track.image,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url || null,
      uri: track.uri,
      expires_at: new Date(Date.now() + CACHE_DURATION_HOURS * 60 * 60 * 1000).toISOString(),
    }))

    const { error } = await supabase
      .from('dale_play_tracks_cache')
      .upsert(cacheData, {
        onConflict: 'track_id',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Error guardando tracks en cache:', error)
    } else {
      console.log(`✅ Cache guardado: ${tracks.length} tracks de Dale Play en Supabase`)
    }
  } catch (error) {
    console.error('Error en saveDalePlayTracksToCache:', error)
  }
}

