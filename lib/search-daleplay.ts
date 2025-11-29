/**
 * Funciones para buscar tracks y artistas del label "Dale Play"
 */

import { spotifyApiRequest } from "./spotify"

export interface Track {
  id: string
  name: string
  artist: string
  album: string
  image: string
  duration_ms: number
  preview_url?: string
  uri: string
}

export interface Artist {
  id: string
  name: string
  genres: string[]
  popularity: number
  image?: string
}

/**
 * Busca tracks del label "Dale Play"
 * Busca por artista y nombre de álbum/label
 */
export async function searchDalePlayTracks(accessToken: string, limit: number = 50): Promise<Track[]> {
  try {
    const tracks: Track[] = []
    const seenTrackIds = new Set<string>()
    
    // Buscar tracks que mencionen "dale play" en varios formatos
    // Spotify no tiene búsqueda directa por label, así que buscamos por texto general
    const searchQueries = [
      'dale play',
      'Dale Play',
      'DALEPLAY',
      'daleplay',
    ]
    
    for (const query of searchQueries) {
      if (tracks.length >= limit) break
      
      try {
        // Buscar tracks
        const searchRes = await spotifyApiRequest(
          `/search?q=${encodeURIComponent(query)}&type=track&limit=50&market=US`,
          accessToken
        )
        const searchData = await searchRes.json()
        
        if (searchData.tracks?.items) {
          searchData.tracks.items.forEach((track: any) => {
            // Verificar que el track tenga relación con Dale Play
            // Por nombre de artista, álbum, o en el nombre del track
            const trackText = `${track.name} ${track.artists?.[0]?.name || ''} ${track.album?.name || ''}`.toLowerCase()
            const isDalePlay = trackText.includes('dale play') || 
                               trackText.includes('daleplay') ||
                               track.artists?.some((a: any) => a.name.toLowerCase().includes('dale play')) ||
                               track.album?.name?.toLowerCase().includes('dale play')
            
            if (isDalePlay && !seenTrackIds.has(track.id)) {
              seenTrackIds.add(track.id)
              tracks.push({
                id: track.id,
                name: track.name,
                artist: track.artists?.[0]?.name || "Unknown",
                album: track.album?.name || "Unknown",
                image: track.album?.images?.[0]?.url || "/icon.png",
                duration_ms: track.duration_ms || 0,
                preview_url: track.preview_url || undefined,
                uri: track.uri,
              })
            }
          })
        }
      } catch (error) {
        console.error(`Error buscando tracks con query "${query}":`, error)
      }
    }
    
    return tracks.slice(0, limit)
  } catch (error) {
    console.error("Error buscando tracks de Dale Play:", error)
    throw error
  }
}

/**
 * Busca artistas del label "Dale Play"
 */
export async function searchDalePlayArtists(accessToken: string, limit: number = 50): Promise<Artist[]> {
  try {
    const artists: Artist[] = []
    const seenArtistIds = new Set<string>()
    
    // Buscar artistas que mencionen "dale play"
    const searchQueries = [
      'dale play',
      'Dale Play',
      'DALEPLAY',
      'daleplay',
    ]
    
    for (const query of searchQueries) {
      if (artists.length >= limit) break
      
      try {
        const searchRes = await spotifyApiRequest(
          `/search?q=${encodeURIComponent(query)}&type=artist&limit=50&market=US`,
          accessToken
        )
        const searchData = await searchRes.json()
        
        if (searchData.artists?.items) {
          searchData.artists.items.forEach((artist: any) => {
            // Filtrar solo artistas que realmente están relacionados con Dale Play
            const artistName = artist.name.toLowerCase()
            const isDalePlay = artistName.includes('dale play') || 
                              artistName.includes('daleplay')
            
            if (isDalePlay && !seenArtistIds.has(artist.id)) {
              seenArtistIds.add(artist.id)
              artists.push({
                id: artist.id,
                name: artist.name,
                genres: artist.genres || [],
                popularity: artist.popularity || 0,
                image: artist.images?.[0]?.url,
              })
            }
          })
        }
      } catch (error) {
        console.error(`Error buscando artistas con query "${query}":`, error)
      }
    }
    
    return artists.slice(0, limit)
  } catch (error) {
    console.error("Error buscando artistas de Dale Play:", error)
    throw error
  }
}

