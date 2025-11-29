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
 * Primero busca artistas, luego busca tracks de esos artistas
 */
export async function searchDalePlayTracks(
  accessToken: string, 
  limit: number = 50,
  dalePlayArtists?: Artist[]
): Promise<Track[]> {
  try {
    const tracks: Track[] = []
    const seenTrackIds = new Set<string>()
    
    // Buscar los artistas de Dale Play si no se proporcionaron
    const artists = dalePlayArtists || await searchDalePlayArtists(accessToken, 50)
    
    if (artists.length === 0) {
      console.warn("No se encontraron artistas de Dale Play")
    }
    
    // Buscar tracks de cada artista de Dale Play
    for (const artist of artists) {
      if (tracks.length >= limit) break
      
      try {
        // Buscar tracks del artista
        const searchRes = await spotifyApiRequest(
          `/search?q=${encodeURIComponent(`artist:"${artist.name}"`)}&type=track&limit=20&market=US`,
          accessToken
        )
        const searchData = await searchRes.json()
        
        if (searchData.tracks?.items) {
          searchData.tracks.items.forEach((track: any) => {
            // Verificar que el artista del track sea de Dale Play
            const trackArtistName = track.artists?.[0]?.name?.toLowerCase() || ''
            const isFromDalePlayArtist = dalePlayArtists.some(dpArtist => 
              dpArtist.name.toLowerCase() === trackArtistName
            )
            
            if (isFromDalePlayArtist && !seenTrackIds.has(track.id)) {
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
        console.error(`Error buscando tracks del artista "${artist.name}":`, error)
      }
    }
    
    // Si no encontramos suficientes tracks, buscar también por texto general
    if (tracks.length < limit) {
      const searchQueries = [
        'label:"dale play"',
        'dale play',
        'Dale Play',
      ]
      
      for (const query of searchQueries) {
        if (tracks.length >= limit) break
        
        try {
          const searchRes = await spotifyApiRequest(
            `/search?q=${encodeURIComponent(query)}&type=track&limit=50&market=US`,
            accessToken
          )
          const searchData = await searchRes.json()
          
          if (searchData.tracks?.items) {
            searchData.tracks.items.forEach((track: any) => {
              // Solo incluir si el artista es de Dale Play
              const trackArtistName = track.artists?.[0]?.name?.toLowerCase() || ''
              const isFromDalePlayArtist = artists.some(dpArtist => 
                dpArtist.name.toLowerCase() === trackArtistName
              )
              
              if (isFromDalePlayArtist && !seenTrackIds.has(track.id)) {
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

