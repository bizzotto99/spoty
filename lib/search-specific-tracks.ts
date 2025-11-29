/**
 * Busca tracks específicos en Spotify por nombre y artista
 * Usado después de que OpenAI selecciona las canciones específicas
 */

import { spotifyApiRequest } from "./spotify"
import type { Track } from "./search-daleplay"

export interface TrackQuery {
  trackName: string
  artistName: string
}

/**
 * Busca un track específico en Spotify por nombre y artista
 */
async function searchSingleTrack(
  accessToken: string,
  trackName: string,
  artistName: string
): Promise<Track | null> {
  try {
    // Buscar track con query: "track:{trackName} artist:{artistName}"
    const query = `track:"${trackName}" artist:"${artistName}"`
    console.log(`[searchSingleTrack] 🔍 Buscando: "${trackName}" de "${artistName}"`)
    const searchRes = await spotifyApiRequest(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=5&market=US`,
      accessToken
    )

    if (!searchRes.ok) {
      console.warn(`Error buscando track "${trackName}" de "${artistName}": ${searchRes.status}`)
      return null
    }

    const searchData = await searchRes.json()
    const tracks = searchData.tracks?.items || []

    if (tracks.length === 0) {
      console.warn(`No se encontró track "${trackName}" de "${artistName}"`)
      return null
    }

    // Buscar el track que coincida mejor (mismo artista)
    const matchingTrack = tracks.find((t: any) => {
      const trackArtist = t.artists?.[0]?.name?.toLowerCase() || ""
      const searchArtist = artistName.toLowerCase()
      return trackArtist.includes(searchArtist) || searchArtist.includes(trackArtist)
    }) || tracks[0]

    // Convertir a formato Track
    const track: Track = {
      id: matchingTrack.id,
      name: matchingTrack.name,
      artist: matchingTrack.artists?.[0]?.name || artistName,
      album: matchingTrack.album?.name || "Unknown",
      image: matchingTrack.album?.images?.[0]?.url || "/icon.png",
      duration_ms: matchingTrack.duration_ms || 0,
      preview_url: matchingTrack.preview_url || undefined,
      uri: matchingTrack.uri,
    }

    return track
  } catch (error) {
    console.error(`Error buscando track "${trackName}" de "${artistName}":`, error)
    return null
  }
}

/**
 * Busca múltiples tracks específicos en Spotify
 * Con delays para evitar rate limiting
 */
export async function searchSpecificTracks(
  trackQueries: TrackQuery[],
  accessToken: string
): Promise<Track[]> {
  const foundTracks: Track[] = []
  const seenTrackIds = new Set<string>()

  for (let i = 0; i < trackQueries.length; i++) {
    const query = trackQueries[i]

    // Delay entre requests (500ms excepto la primera)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    try {
      const track = await searchSingleTrack(
        accessToken,
        query.trackName,
        query.artistName
      )

      if (track && !seenTrackIds.has(track.id)) {
        seenTrackIds.add(track.id)
        foundTracks.push(track)
        console.log(`✅ Encontrado: "${track.name}" de "${track.artist}"`)
      } else if (!track) {
        console.warn(`❌ No encontrado: "${query.trackName}" de "${query.artistName}"`)
      }
    } catch (error) {
      console.error(`Error procesando track "${query.trackName}":`, error)
      continue
    }
  }

  console.log(`🎵 Encontrados ${foundTracks.length} de ${trackQueries.length} tracks solicitados`)
  return foundTracks
}
