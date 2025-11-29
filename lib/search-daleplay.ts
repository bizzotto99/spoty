/**
 * Funciones para buscar tracks y artistas del label "Dale Play Records"
 * Busca por el label real en Spotify, no por texto en nombres
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

const DALE_PLAY_LABEL = "Dale Play Records"

/**
 * Busca álbumes del label "Dale Play Records"
 * A partir de los álbumes, extrae los tracks
 */
export async function searchDalePlayTracks(
  accessToken: string, 
  limit: number = 50,
  dalePlayArtists?: Artist[]
): Promise<Track[]> {
  try {
    const tracks: Track[] = []
    const seenTrackIds = new Set<string>()
    const seenAlbumIds = new Set<string>()
    
    // Buscar álbumes del label "Dale Play Records"
    const searchQueries = [
      `label:"${DALE_PLAY_LABEL}"`,
      `label:"Dale Play Records"`,
      `label:"dale play records"`,
    ]
    
    for (const query of searchQueries) {
      if (tracks.length >= limit) break
      
      try {
        // Buscar álbumes del label
        const albumSearchRes = await spotifyApiRequest(
          `/search?q=${encodeURIComponent(query)}&type=album&limit=50&market=US`,
          accessToken
        )
        const albumSearchData = await albumSearchRes.json()
        
        if (albumSearchData.albums?.items) {
          // Para cada álbum, obtener sus tracks
          for (const album of albumSearchData.albums.items) {
            if (tracks.length >= limit) break
            if (seenAlbumIds.has(album.id)) continue
            
            seenAlbumIds.add(album.id)
            
            try {
              // Obtener los tracks del álbum
              const albumTracksRes = await spotifyApiRequest(
                `/albums/${album.id}/tracks?limit=50&market=US`,
                accessToken
              )
              const albumTracksData = await albumTracksRes.json()
              
              if (albumTracksData.items) {
                albumTracksData.items.forEach((track: any) => {
                  if (tracks.length >= limit) return
                  if (seenTrackIds.has(track.id)) return
                  
                  seenTrackIds.add(track.id)
                  
                  // Obtener información completa del track
                  tracks.push({
                    id: track.id,
                    name: track.name,
                    artist: track.artists?.[0]?.name || "Unknown",
                    album: album.name || "Unknown",
                    image: album.images?.[0]?.url || "/icon.png",
                    duration_ms: track.duration_ms || 0,
                    preview_url: undefined, // Se obtendrá después si es necesario
                    uri: track.uri,
                  })
                })
              }
            } catch (error) {
              console.error(`Error obteniendo tracks del álbum "${album.name}":`, error)
            }
          }
        }
      } catch (error) {
        console.error(`Error buscando álbumes con query "${query}":`, error)
      }
    }
    
    // Obtener información completa de los tracks (incluyendo preview_url)
    if (tracks.length > 0) {
      const trackIds = tracks.map(t => t.id).slice(0, 50) // Spotify limita a 50 tracks por request
      try {
        const tracksInfoRes = await spotifyApiRequest(
          `/tracks?ids=${trackIds.join(',')}&market=US`,
          accessToken
        )
        const tracksInfoData = await tracksInfoRes.json()
        
        if (tracksInfoData.tracks) {
          const trackMap = new Map(tracksInfoData.tracks.map((t: any) => [t.id, t]))
          tracks.forEach(track => {
            const fullTrack = trackMap.get(track.id)
            if (fullTrack) {
              track.preview_url = fullTrack.preview_url || undefined
              track.image = fullTrack.album?.images?.[0]?.url || track.image
            }
          })
        }
      } catch (error) {
        console.error("Error obteniendo información completa de tracks:", error)
      }
    }
    
    return tracks.slice(0, limit)
  } catch (error) {
    console.error("Error buscando tracks de Dale Play Records:", error)
    throw error
  }
}

/**
 * Busca artistas del label "Dale Play Records"
 * Busca álbumes del label y extrae los artistas únicos
 */
export async function searchDalePlayArtists(accessToken: string, limit: number = 50): Promise<Artist[]> {
  try {
    const artists: Artist[] = []
    const seenArtistIds = new Set<string>()
    
    // Buscar álbumes del label "Dale Play Records"
    const searchQueries = [
      `label:"${DALE_PLAY_LABEL}"`,
      `label:"Dale Play Records"`,
      `label:"dale play records"`,
    ]
    
    for (const query of searchQueries) {
      if (artists.length >= limit) break
      
      try {
        const albumSearchRes = await spotifyApiRequest(
          `/search?q=${encodeURIComponent(query)}&type=album&limit=50&market=US`,
          accessToken
        )
        const albumSearchData = await albumSearchRes.json()
        
        if (albumSearchData.albums?.items) {
          // Extraer todos los artistas únicos de los álbumes
          albumSearchData.albums.items.forEach((album: any) => {
            if (album.artists && album.artists.length > 0) {
              album.artists.forEach((artist: any) => {
                if (!seenArtistIds.has(artist.id) && artists.length < limit) {
                  seenArtistIds.add(artist.id)
                  artists.push({
                    id: artist.id,
                    name: artist.name,
                    genres: [], // Los géneros se obtendrán después
                    popularity: 0,
                    image: undefined,
                  })
                }
              })
            }
          })
        }
      } catch (error) {
        console.error(`Error buscando álbumes con query "${query}":`, error)
      }
    }
    
    // Obtener información completa de los artistas (géneros, popularidad, imagen)
    if (artists.length > 0) {
      const artistIds = artists.map(a => a.id).slice(0, 50) // Spotify limita a 50 artistas por request
      try {
        const artistsInfoRes = await spotifyApiRequest(
          `/artists?ids=${artistIds.join(',')}`,
          accessToken
        )
        const artistsInfoData = await artistsInfoRes.json()
        
        if (artistsInfoData.artists) {
          const artistMap = new Map(artistsInfoData.artists.map((a: any) => [a.id, a]))
          artists.forEach(artist => {
            const fullArtist = artistMap.get(artist.id)
            if (fullArtist) {
              artist.genres = fullArtist.genres || []
              artist.popularity = fullArtist.popularity || 0
              artist.image = fullArtist.images?.[0]?.url
            }
          })
        }
      } catch (error) {
        console.error("Error obteniendo información completa de artistas:", error)
      }
    }
    
    return artists.slice(0, limit)
  } catch (error) {
    console.error("Error buscando artistas de Dale Play Records:", error)
    throw error
  }
}

