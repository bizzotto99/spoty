/**
 * Busca tracks específicos en Spotify basándose en nombre y artista
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

export interface TrackSearchQuery {
  trackName: string
  artistName: string
}

/**
 * Busca un track específico en Spotify por nombre y artista
 */
async function searchTrackInSpotify(
  trackName: string,
  artistName: string,
  accessToken: string
): Promise<Track | null> {
  try {
    // Buscar el track en Spotify
    const query = `track:"${trackName}" artist:"${artistName}"`
    const searchRes = await spotifyApiRequest(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=5&market=US`,
      accessToken
    )

    if (!searchRes.ok) {
      console.warn(`Error buscando track "${trackName}" de "${artistName}": ${searchRes.status}`)
      return null
    }

    const searchData = await searchRes.json()

    if (!searchData.tracks?.items || searchData.tracks.items.length === 0) {
      console.warn(`No se encontró track "${trackName}" de "${artistName}"`)
      return null
    }

    // Buscar el mejor match (artista coincide mejor)
    const tracks = searchData.tracks.items
    const bestMatch = tracks.find((t: any) => 
      t.artists?.some((a: any) => 
        a.name.toLowerCase().includes(artistName.toLowerCase()) ||
        artistName.toLowerCase().includes(a.name.toLowerCase())
      )
    ) || tracks[0]

    const track = bestMatch as any
    return {
      id: track.id,
      name: track.name,
      artist: track.artists?.[0]?.name || artistName,
      album: track.album?.name || "Unknown",
      image: track.album?.images?.[0]?.url || "/icon.png",
      duration_ms: track.duration_ms || 0,
      preview_url: track.preview_url || undefined,
      uri: track.uri,
    }
  } catch (error) {
    console.error(`Error buscando track "${trackName}" de "${artistName}":`, error)
    return null
  }
}

/**
 * Busca múltiples tracks específicos en Spotify
 * Devuelve solo los tracks que se encontraron exitosamente
 */
export async function searchSpecificTracks(
  trackQueries: TrackSearchQuery[],
  accessToken: string
): Promise<Track[]> {
  const foundTracks: Track[] = []
  
  // Buscar tracks con delays para evitar rate limiting
  for (let i = 0; i < trackQueries.length; i++) {
    const query = trackQueries[i]
    
    try {
      const track = await searchTrackInSpotify(query.trackName, query.artistName, accessToken)
      
      if (track) {
        foundTracks.push(track)
        console.log(`✅ Encontrado: "${track.name}" - ${track.artist}`)
      } else {
        console.warn(`❌ No encontrado: "${query.trackName}" - ${query.artistName}`)
      }

      // Aumentar delay a 500ms entre búsquedas para evitar rate limiting
      if (i < trackQueries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 500ms entre búsquedas
      }
    } catch (error) {
      console.error(`Error procesando track "${query.trackName}":`, error)
      // Continuar con el siguiente track
    }
  }

  console.log(`📊 Total tracks encontrados: ${foundTracks.length} de ${trackQueries.length} solicitados`)
  return foundTracks
}

