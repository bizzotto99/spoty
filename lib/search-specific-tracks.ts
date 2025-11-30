/**
 * Busca tracks específicos en Spotify por nombre y artista
 * Usado después de que OpenAI selecciona las canciones específicas
 * OpenAI ya filtró por label, aquí solo buscamos los tracks
 */

import { spotifyApiRequest } from "./spotify"
import type { Track } from "./search-daleplay"

export interface TrackQuery {
  trackName: string
  artistName: string
}

/**
 * Busca un track específico en Spotify por nombre y artista
 * NO verifica el label (OpenAI ya lo hizo)
 */
async function searchSingleTrack(
  accessToken: string,
  trackName: string,
  artistName: string
): Promise<Track | null> {
  try {
    // Validar que trackName y artistName sean strings válidos
    if (!trackName || typeof trackName !== 'string' || trackName.trim().length === 0) {
      console.warn(`[searchSingleTrack] ❌ trackName inválido:`, trackName)
      return null
    }
    
    if (!artistName || typeof artistName !== 'string' || artistName.trim().length === 0) {
      console.warn(`[searchSingleTrack] ❌ artistName inválido:`, artistName)
      return null
    }
    
    // Estrategia 1: Buscar por track + artist
    const query = `track:"${trackName.trim()}" artist:"${artistName.trim()}"`
    console.log(`[searchSingleTrack] 🔍 Buscando: "${trackName}" de "${artistName}"`)
    
    let searchRes = await spotifyApiRequest(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=US`,
      accessToken,
      { context: `searchSingleTrack - ${trackName} by ${artistName}` }
    )

    if (!searchRes.ok) {
      console.warn(`Error buscando track "${trackName}" de "${artistName}": ${searchRes.status}`)
      return null
    }

    const searchData = await searchRes.json()
    let tracks = searchData.tracks?.items || []

    // Si no encuentra, intentar solo por nombre de track
    if (tracks.length === 0) {
      const altQuery = `track:"${trackName.trim()}"`
      console.log(`[searchSingleTrack] 🔄 Búsqueda alternativa: "${trackName}"`)
      
      searchRes = await spotifyApiRequest(
        `/search?q=${encodeURIComponent(altQuery)}&type=track&limit=10&market=US`,
        accessToken,
        { context: `searchSingleTrack alternative - ${trackName}` }
      )
      
      if (searchRes.ok) {
        const altData = await searchRes.json()
        tracks = altData.tracks?.items || []
      }
    }

    if (tracks.length === 0) {
      console.warn(`❌ No se encontró track "${trackName}" de "${artistName}"`)
      return null
    }

    // Tomar el primer resultado (el más relevante según Spotify)
    const trackItem = tracks[0]
    
    const track: Track = {
      id: trackItem.id,
      name: trackItem.name,
      artist: trackItem.artists?.[0]?.name || artistName,
      album: trackItem.album?.name || "Unknown",
      image: trackItem.album?.images?.[0]?.url || "/icon.png",
      duration_ms: trackItem.duration_ms || 0,
      preview_url: trackItem.preview_url || undefined,
      uri: trackItem.uri,
    }
    
    console.log(`✅ Track encontrado: "${track.name}" de "${track.artist}"`)
    return track

  } catch (error) {
    console.error(`Error buscando track "${trackName}" de "${artistName}":`, error)
    return null
  }
}

/**
 * Busca múltiples tracks específicos en Spotify
 * Con delays de 5 segundos entre cada búsqueda para evitar rate limiting
 */
export async function searchSpecificTracks(
  trackQueries: TrackQuery[],
  accessToken: string
): Promise<Track[]> {
  const foundTracks: Track[] = []
  const seenTrackIds = new Set<string>()

  console.log(`🔍 Buscando ${trackQueries.length} tracks en Spotify con delays de 5s...`)

  for (let i = 0; i < trackQueries.length; i++) {
    const query = trackQueries[i]

    // Delay de 5 segundos entre búsquedas (excepto la primera)
    if (i > 0) {
      console.log(`⏳ Esperando 5 segundos antes de buscar track ${i + 1}/${trackQueries.length}...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
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
        console.log(`✅ [${i + 1}/${trackQueries.length}] Encontrado: "${track.name}" de "${track.artist}"`)
      } else if (!track) {
        console.warn(`❌ [${i + 1}/${trackQueries.length}] No encontrado: "${query.trackName}" de "${query.artistName}"`)
      }
    } catch (error) {
      console.error(`❌ [${i + 1}/${trackQueries.length}] Error procesando "${query.trackName}":`, error)
      continue
    }
  }

  console.log(`🎵 Resultado final: ${foundTracks.length} de ${trackQueries.length} tracks encontrados`)
  return foundTracks
}
