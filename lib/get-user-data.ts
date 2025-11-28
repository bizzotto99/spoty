/**
 * Obtiene datos del usuario de Spotify para personalizar las recomendaciones
 */

import { spotifyApiRequest } from "./spotify"

export interface UserSpotifyData {
  topArtists: {
    shortTerm: Array<{
      id: string
      name: string
      genres: string[]
      popularity: number
    }>
    mediumTerm: Array<{
      id: string
      name: string
      genres: string[]
      popularity: number
    }>
  }
  topGenres: string[]
  favoriteArtists: Array<{
    name: string
    genres: string[]
  }>
  musicPreferences: {
    energy: "high" | "medium" | "low"
    tempo: "fast" | "medium" | "slow"
    mood: "upbeat" | "mellow"
  }
  recentTracks: Array<{
    id: string
    name: string
    artist: string
  }>
}

/**
 * Extrae géneros únicos de una lista de artistas
 */
function extractGenres(artists: Array<{ genres?: string[] }>): string[] {
  const genreSet = new Set<string>()
  
  artists.forEach((artist) => {
    if (artist.genres && Array.isArray(artist.genres)) {
      artist.genres.forEach((genre) => genreSet.add(genre))
    }
  })
  
  return Array.from(genreSet)
}

/**
 * Obtiene los top géneros basado en frecuencia
 */
function getTopGenres(allGenres: string[], limit: number = 5): string[] {
  const genreCount: Record<string, number> = {}
  
  allGenres.forEach((genre) => {
    genreCount[genre] = (genreCount[genre] || 0) + 1
  })
  
  return Object.entries(genreCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre)
}

/**
 * Obtiene datos del usuario de Spotify para personalización
 */
export async function getUserSpotifyData(accessToken: string): Promise<UserSpotifyData> {
  try {
    // Obtener top artists (corto y mediano plazo)
    const [shortTermArtistsRes, mediumTermArtistsRes, topTracksRes, recentlyPlayedRes] = await Promise.all([
      spotifyApiRequest("/me/top/artists?time_range=short_term&limit=20", accessToken),
      spotifyApiRequest("/me/top/artists?time_range=medium_term&limit=20", accessToken),
      spotifyApiRequest("/me/top/tracks?time_range=short_term&limit=20", accessToken),
      spotifyApiRequest("/me/player/recently-played?limit=20", accessToken),
    ])

    const shortTermArtists = await shortTermArtistsRes.json()
    const mediumTermArtists = await mediumTermArtistsRes.json()
    const topTracks = await topTracksRes.json()
    const recentlyPlayed = await recentlyPlayedRes.json()

    // Extraer géneros de todos los artistas
    const allArtists = [
      ...(shortTermArtists.items || []),
      ...(mediumTermArtists.items || []),
    ]
    
    const allGenres = extractGenres(allArtists)
    const topGenres = getTopGenres(allGenres, 10)

    // Procesar artistas favoritos (top 10 combinados)
    const favoriteArtists = allArtists
      .slice(0, 10)
      .map((artist: any) => ({
        name: artist.name,
        genres: artist.genres || [],
      }))

    // Obtener audio features de las top tracks para inferir preferencias
    const trackIds = (topTracks.items || [])
      .slice(0, 10)
      .map((track: any) => track.id)
      .filter(Boolean)
      .join(",")

    let musicPreferences = {
      energy: "medium" as const,
      tempo: "medium" as const,
      mood: "upbeat" as const,
    }

    if (trackIds) {
      try {
        const audioFeaturesRes = await spotifyApiRequest(
          `/audio-features?ids=${trackIds}`,
          accessToken
        )
        const audioFeatures = await audioFeaturesRes.json()

        if (audioFeatures.audio_features && audioFeatures.audio_features.length > 0) {
          const validFeatures = audioFeatures.audio_features.filter((f: any) => f !== null)
          
          if (validFeatures.length > 0) {
            const avgEnergy =
              validFeatures.reduce((sum: number, f: any) => sum + (f.energy || 0), 0) /
              validFeatures.length
            const avgTempo =
              validFeatures.reduce((sum: number, f: any) => sum + (f.tempo || 0), 0) /
              validFeatures.length
            const avgValence =
              validFeatures.reduce((sum: number, f: any) => sum + (f.valence || 0), 0) /
              validFeatures.length

            musicPreferences = {
              energy: avgEnergy > 0.7 ? "high" : avgEnergy > 0.4 ? "medium" : "low",
              tempo: avgTempo > 140 ? "fast" : avgTempo > 100 ? "medium" : "slow",
              mood: avgValence > 0.6 ? "upbeat" : "mellow",
            }
          }
        }
      } catch (error) {
        console.error("Error obteniendo audio features:", error)
        // Usar valores por defecto si falla
      }
    }

    // Procesar tracks recientes
    const recentTracks = (recentlyPlayed.items || []).map((item: any) => ({
      id: item.track?.id || "",
      name: item.track?.name || "",
      artist: item.track?.artists?.[0]?.name || "",
    }))

    return {
      topArtists: {
        shortTerm: (shortTermArtists.items || []).map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          genres: artist.genres || [],
          popularity: artist.popularity || 0,
        })),
        mediumTerm: (mediumTermArtists.items || []).map((artist: any) => ({
          id: artist.id,
          name: artist.name,
          genres: artist.genres || [],
          popularity: artist.popularity || 0,
        })),
      },
      topGenres,
      favoriteArtists,
      musicPreferences,
      recentTracks,
    }
  } catch (error) {
    console.error("Error obteniendo datos del usuario:", error)
    throw error
  }
}

