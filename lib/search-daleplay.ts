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
    
    // Buscar álbumes que puedan tener "Dale Play Records" como label
    // Solo usar una query para reducir requests
    const searchQueries = [
      'Dale Play Records',
    ]
    
    for (const query of searchQueries) {
      if (tracks.length >= limit) break
      
      try {
        // Buscar álbumes (reducir límite a 10 para hacer menos requests)
        const albumSearchRes = await spotifyApiRequest(
          `/search?q=${encodeURIComponent(query)}&type=album&limit=10&market=US`,
          accessToken
        )
        const albumSearchData = await albumSearchRes.json()
        
        if (albumSearchData.albums?.items) {
          // Para cada álbum, obtener sus detalles completos para verificar el label
          for (const album of albumSearchData.albums.items) {
            if (tracks.length >= limit) break
            if (seenAlbumIds.has(album.id)) continue
            
            try {
              // Aumentar delay a 500ms para evitar rate limiting
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // Obtener detalles completos del álbum para ver el label
              const albumDetailsRes = await spotifyApiRequest(
                `/albums/${album.id}?market=US`,
                accessToken
              )
              
              // Verificar si la respuesta es válida antes de parsear JSON
              if (!albumDetailsRes.ok) {
                const errorText = await albumDetailsRes.text()
                if (albumDetailsRes.status === 429 || errorText.includes("Too many requests")) {
                  console.warn(`Rate limit al obtener álbum "${album.name}". Esperando 5 segundos...`)
                  await new Promise(resolve => setTimeout(resolve, 5000))
                  continue
                }
                console.error(`Error obteniendo álbum "${album.name}": ${albumDetailsRes.status}`)
                continue
              }
              
              const albumDetails = await albumDetailsRes.json()
              
              // Verificar que el label contenga "dale play records" (case-insensitive)
              const albumLabel = albumDetails.label?.toLowerCase() || ''
              const isDalePlayLabel = albumLabel.includes('dale play records')
              
              if (!isDalePlayLabel) {
                continue // Saltar álbumes que no son del label
              }
              
              seenAlbumIds.add(album.id)
              
              // Obtener los tracks del álbum
              // Aumentar delay a 500ms para evitar rate limiting
              await new Promise(resolve => setTimeout(resolve, 500))
              
              const albumTracksRes = await spotifyApiRequest(
                `/albums/${album.id}/tracks?limit=50&market=US`,
                accessToken
              )
              
              // Verificar si la respuesta es válida antes de parsear JSON
              if (!albumTracksRes.ok) {
                const errorText = await albumTracksRes.text()
                if (albumTracksRes.status === 429 || errorText.includes("Too many requests")) {
                  console.warn(`Rate limit al obtener tracks del álbum "${album.name}". Esperando 5 segundos...`)
                  await new Promise(resolve => setTimeout(resolve, 5000)) // Esperar 5 segundos
                  continue // Saltar este álbum y continuar con el siguiente
                }
                console.error(`Error obteniendo tracks del álbum "${album.name}": ${albumTracksRes.status} ${errorText.substring(0, 100)}`)
                continue // Continuar con el siguiente álbum en lugar de lanzar error
              }
              
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
                    album: albumDetails.name || "Unknown",
                    image: albumDetails.images?.[0]?.url || "/icon.png",
                    duration_ms: track.duration_ms || 0,
                    preview_url: undefined, // Se obtendrá después si es necesario
                    uri: track.uri,
                  })
                })
              }
            } catch (error) {
              console.error(`Error obteniendo detalles del álbum "${album.name}":`, error)
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
            const fullTrack = trackMap.get(track.id) as any
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
    
    // Buscar álbumes que puedan tener "Dale Play Records" como label
    // Solo usar una query para reducir requests
    const searchQueries = [
      'Dale Play Records',
    ]
    
    for (const query of searchQueries) {
      if (artists.length >= limit) break
      
      try {
        const albumSearchRes = await spotifyApiRequest(
          `/search?q=${encodeURIComponent(query)}&type=album&limit=10&market=US`,
          accessToken
        )
        const albumSearchData = await albumSearchRes.json()
        
        if (albumSearchData.albums?.items) {
          // Para cada álbum, verificar que sea del label correcto
          for (const album of albumSearchData.albums.items) {
            if (artists.length >= limit) break
            
            try {
              // Aumentar delay a 500ms para evitar rate limiting
              await new Promise(resolve => setTimeout(resolve, 500))
              
              // Obtener detalles completos del álbum para ver el label
              const albumDetailsRes = await spotifyApiRequest(
                `/albums/${album.id}?market=US`,
                accessToken
              )
              
              // Verificar si la respuesta es válida antes de parsear JSON
              if (!albumDetailsRes.ok) {
                const errorText = await albumDetailsRes.text()
                if (albumDetailsRes.status === 429 || errorText.includes("Too many requests")) {
                  console.warn(`Rate limit al obtener álbum "${album.name}". Esperando 5 segundos...`)
                  await new Promise(resolve => setTimeout(resolve, 5000))
                  continue
                }
                console.error(`Error obteniendo álbum "${album.name}": ${albumDetailsRes.status}`)
                continue
              }
              
              const albumDetails = await albumDetailsRes.json()
              
              // Verificar que el label contenga "dale play records" (case-insensitive)
              const albumLabel = albumDetails.label?.toLowerCase() || ''
              const isDalePlayLabel = albumLabel.includes('dale play records')
              
              if (!isDalePlayLabel) {
                continue // Saltar álbumes que no son del label
              }
              
              // Extraer artistas únicos de este álbum
              if (albumDetails.artists && albumDetails.artists.length > 0) {
                albumDetails.artists.forEach((artist: any) => {
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
            } catch (error) {
              console.error(`Error obteniendo detalles del álbum "${album.name}":`, error)
            }
          }
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
            const fullArtist = artistMap.get(artist.id) as any
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

