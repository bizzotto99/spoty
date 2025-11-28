/**
 * Funciones para buscar canciones en Spotify basado en criterios
 */

import { spotifyApiRequest } from "./spotify"
import type { GeminiPlaylistCriteria } from "./gemini"

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

/**
 * Busca tracks en Spotify basado en criterios de Gemini
 */
export async function searchTracksInSpotify(
  accessToken: string,
  criteria: GeminiPlaylistCriteria["criteria"],
  userFavoriteArtists: string[] = []
): Promise<Track[]> {
  try {
    const tracks: Track[] = []
    const maxTracks = criteria.maxTracks || 30

    // Estrategia 1: Buscar por artistas favoritos del usuario si están en los criterios
    if (criteria.artists && criteria.artists.length > 0) {
      for (const artist of criteria.artists.slice(0, 3)) {
        try {
          const searchRes = await spotifyApiRequest(
            `/search?q=artist:${encodeURIComponent(artist)}&type=track&limit=10&market=US`,
            accessToken
          )
          const searchData = await searchRes.json()
          
          if (searchData.tracks?.items) {
            searchData.tracks.items.forEach((track: any) => {
              if (tracks.length < maxTracks && !tracks.find(t => t.id === track.id)) {
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
          console.error(`Error buscando artista ${artist}:`, error)
        }
      }
    }

    // Estrategia 2: Buscar por géneros
    if (criteria.genres && criteria.genres.length > 0 && tracks.length < maxTracks) {
      for (const genre of criteria.genres.slice(0, 3)) {
        try {
          // Buscar por género usando una query de búsqueda
          const query = `genre:"${genre}"`
          const searchRes = await spotifyApiRequest(
            `/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=US`,
            accessToken
          )
          const searchData = await searchRes.json()
          
          if (searchData.tracks?.items) {
            searchData.tracks.items.forEach((track: any) => {
              if (tracks.length < maxTracks && !tracks.find(t => t.id === track.id)) {
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
          console.error(`Error buscando género ${genre}:`, error)
        }
      }
    }

    // Estrategia 3: Usar Spotify Recommendations API si tenemos suficientes semillas
    if (tracks.length < maxTracks && userFavoriteArtists.length > 0) {
      try {
        // Usar los artistas favoritos como semillas para recomendaciones
        const seedArtists = userFavoriteArtists.slice(0, 5).join(",")
        
        // Construir parámetros para recommendations
        const params = new URLSearchParams({
          seed_artists: seedArtists,
          limit: String(Math.min(20, maxTracks - tracks.length)),
          market: "US",
        })

        // Agregar filtros de audio features si están disponibles
        if (criteria.energy) {
          const targetEnergy = criteria.energy === "high" ? 0.8 : criteria.energy === "low" ? 0.3 : 0.5
          params.append("target_energy", String(targetEnergy))
        }

        if (criteria.tempo && criteria.bpmRange) {
          params.append("target_tempo", String((criteria.bpmRange[0] + criteria.bpmRange[1]) / 2))
        }

        const recommendationsRes = await spotifyApiRequest(
          `/recommendations?${params.toString()}`,
          accessToken
        )
        const recommendationsData = await recommendationsRes.json()

        if (recommendationsData.tracks) {
          recommendationsData.tracks.forEach((track: any) => {
            if (tracks.length < maxTracks && !tracks.find(t => t.id === track.id)) {
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
        console.error("Error obteniendo recomendaciones:", error)
      }
    }

    // Si aún no tenemos suficientes tracks, hacer búsqueda más general
    if (tracks.length < maxTracks) {
      try {
        // Construir query general basada en criterios
        const queryParts: string[] = []
        
        if (criteria.genres && criteria.genres.length > 0) {
          queryParts.push(criteria.genres[0])
        }
        
        if (criteria.artists && criteria.artists.length > 0) {
          queryParts.push(criteria.artists[0])
        }

        const generalQuery = queryParts.join(" ") || "popular"
        
        const searchRes = await spotifyApiRequest(
          `/search?q=${encodeURIComponent(generalQuery)}&type=track&limit=${maxTracks - tracks.length}&market=US`,
          accessToken
        )
        const searchData = await searchRes.json()

        if (searchData.tracks?.items) {
          searchData.tracks.items.forEach((track: any) => {
            if (tracks.length < maxTracks && !tracks.find(t => t.id === track.id)) {
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
        console.error("Error en búsqueda general:", error)
      }
    }

    // Filtrar tracks según excludeGenres si está definido
    let finalTracks = tracks
    if (criteria.excludeGenres && criteria.excludeGenres.length > 0) {
      // Nota: Spotify API no permite filtrar por exclude en search,
      // esto sería una simplificación. En producción podrías usar audio features
      // o hacer múltiples búsquedas para filtrar.
      finalTracks = tracks.slice(0, maxTracks)
    } else {
      finalTracks = tracks.slice(0, maxTracks)
    }

    return finalTracks
  } catch (error) {
    console.error("Error buscando tracks:", error)
    throw error
  }
}

