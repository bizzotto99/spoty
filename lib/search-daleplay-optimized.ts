/**
 * Funciones OPTIMIZADAS para buscar tracks y artistas del label "Dale Play Records"
 * - Busca álbumes UNA SOLA VEZ
 * - Extrae artistas y tracks de los mismos álbumes
 * - Usa cache de Supabase
 * - Minimiza requests a Spotify
 */

import { spotifyApiRequest } from "./spotify"
import { 
  getCachedDalePlayArtists, 
  saveDalePlayArtistsToCache,
  getCachedDalePlayTracks,
  saveDalePlayTracksToCache 
} from "./supabase-daleplay-cache"
import type { Artist, Track } from "./search-daleplay"

const DALE_PLAY_LABEL = "Dale Play Records"
const MAX_ALBUMS_TO_SEARCH = 3 // Reducido drásticamente para evitar rate limiting (3 álbumes = ~20-30 tracks)

interface ValidatedAlbum {
  id: string
  name: string
  label: string
  artists: Array<{ id: string; name: string }>
}

/**
 * Busca y valida álbumes de Dale Play Records UNA SOLA VEZ
 * Esta función es compartida por artistas y tracks
 */
async function searchAndValidateDalePlayAlbums(
  accessToken: string
): Promise<ValidatedAlbum[]> {
  try {
    // 1. Buscar álbumes (1 request)
    console.log(`[searchAndValidateDalePlayAlbums] 🔍 Buscando álbumes del label "${DALE_PLAY_LABEL}"...`)
    const albumSearchRes = await spotifyApiRequest(
      `/search?q=${encodeURIComponent(`label:"${DALE_PLAY_LABEL}"`)}&type=album&limit=${MAX_ALBUMS_TO_SEARCH}&market=US`,
      accessToken
    )

    if (!albumSearchRes.ok) {
      const errorText = await albumSearchRes.text()
      console.error(`Error buscando álbumes: ${albumSearchRes.status} ${errorText.substring(0, 100)}`)
      return []
    }

    const albumSearchData = await albumSearchRes.json()
    const albums = albumSearchData.albums?.items || []

    if (albums.length === 0) {
      console.warn('No se encontraron álbumes en la búsqueda inicial')
      return []
    }

    // 2. Validar álbumes y extraer información (hasta 5 requests con delay de 5s entre cada uno)
    const validatedAlbums: ValidatedAlbum[] = []
    
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i]
      
      // Delay entre requests (5000ms = 5 segundos excepto la primera) para evitar rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

      try {
        console.log(`[searchAndValidateDalePlayAlbums] 📀 Obteniendo detalles del álbum: "${album.name}" (ID: ${album.id})`)
        const albumDetailsRes = await spotifyApiRequest(
          `/albums/${album.id}?market=US`,
          accessToken
        )

        if (!albumDetailsRes.ok) {
          if (albumDetailsRes.status === 429) {
            console.warn(`Rate limit al obtener álbum "${album.name}". Esperando...`)
            await new Promise(resolve => setTimeout(resolve, 5000))
            continue
          }
          continue
        }

        const albumDetails = await albumDetailsRes.json()
        const albumLabel = albumDetails.label?.toLowerCase() || ''
        
        // Verificar que el label contenga "dale play records" (case-insensitive)
        if (albumLabel.includes('dale play records')) {
          validatedAlbums.push({
            id: albumDetails.id,
            name: albumDetails.name,
            label: albumDetails.label,
            artists: (albumDetails.artists || []).map((a: any) => ({
              id: a.id,
              name: a.name,
            })),
          })
        }
      } catch (error) {
        console.error(`Error obteniendo detalles del álbum "${album.name}":`, error)
        continue
      }
    }

    console.log(`✅ Validados ${validatedAlbums.length} álbumes de Dale Play Records`)
    return validatedAlbums
  } catch (error) {
    console.error('Error en searchAndValidateDalePlayAlbums:', error)
    return []
  }
}

/**
 * OPTIMIZADA: Busca artistas de Dale Play Records
 * - Usa cache de Supabase si está disponible
 * - Comparte la búsqueda de álbumes con tracks
 */
export async function searchDalePlayArtistsOptimized(
  accessToken: string,
  limit: number = 10,
  validatedAlbums?: ValidatedAlbum[]
): Promise<Artist[]> {
  try {
    // 1. Intentar obtener del cache primero
    const cachedArtists = await getCachedDalePlayArtists()
    if (cachedArtists && cachedArtists.length > 0) {
      return cachedArtists.slice(0, limit)
    }

    // 2. Si no hay cache, buscar álbumes (o usar los ya validados)
    let albums = validatedAlbums
    if (!albums || albums.length === 0) {
      albums = await searchAndValidateDalePlayAlbums(accessToken)
    }

    if (albums.length === 0) {
      console.warn('No se encontraron álbumes validados')
      return []
    }

    // 3. Extraer artistas únicos de los álbumes
    const artistsMap = new Map<string, Artist>()
    
    for (const album of albums) {
      for (const artist of album.artists) {
        if (!artistsMap.has(artist.id) && artistsMap.size < limit) {
          artistsMap.set(artist.id, {
            id: artist.id,
            name: artist.name,
            genres: [],
            popularity: 0,
            image: undefined,
          })
        }
      }
    }

    const artists = Array.from(artistsMap.values())

    if (artists.length === 0) {
      return []
    }

    // 4. Obtener información completa de artistas (1 request combinado)
    const artistIds = artists.map(a => a.id).slice(0, 50) // Spotify limita a 50
    
      try {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Delay 5s antes del request para evitar rate limiting
        
        console.log(`[searchDalePlayArtistsOptimized] 🎤 Obteniendo información de ${artistIds.length} artistas...`)
        const artistsInfoRes = await spotifyApiRequest(
          `/artists?ids=${artistIds.join(',')}`,
          accessToken
        )

      if (artistsInfoRes.ok) {
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
      }
    } catch (error) {
      console.error("Error obteniendo información completa de artistas:", error)
    }

    // 5. Guardar en cache
    await saveDalePlayArtistsToCache(artists)

    return artists.slice(0, limit)
  } catch (error) {
    console.error("Error en searchDalePlayArtistsOptimized:", error)
    throw error
  }
}

/**
 * OPTIMIZADA: Busca tracks de Dale Play Records
 * - Usa cache de Supabase si está disponible
 * - Comparte la búsqueda de álbumes con artistas
 */
export async function searchDalePlayTracksOptimized(
  accessToken: string,
  limit: number = 25,
  validatedAlbums?: ValidatedAlbum[]
): Promise<Track[]> {
  try {
    // 1. Intentar obtener del cache primero
    const cachedTracks = await getCachedDalePlayTracks(limit)
    if (cachedTracks && cachedTracks.length >= limit) {
      return cachedTracks.slice(0, limit)
    }

    // 2. Si no hay cache o no hay suficientes, buscar álbumes (o usar los ya validados)
    let albums = validatedAlbums
    if (!albums || albums.length === 0) {
      albums = await searchAndValidateDalePlayAlbums(accessToken)
    }

    if (albums.length === 0) {
      console.warn('No se encontraron álbumes validados')
      return []
    }

    // 3. Obtener tracks de los álbumes validados (hasta 8 requests, pero optimizado)
    const tracks: Track[] = []
    const seenTrackIds = new Set<string>()

    for (let i = 0; i < albums.length && tracks.length < limit; i++) {
      const album = albums[i]

      // Delay entre requests (5000ms = 5 segundos excepto la primera) para evitar rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

      try {
        console.log(`[searchDalePlayTracksOptimized] 🎵 Obteniendo tracks del álbum: "${album.name}" (ID: ${album.id})`)
        const albumTracksRes = await spotifyApiRequest(
          `/albums/${album.id}/tracks?limit=50&market=US`,
          accessToken
        )

        if (!albumTracksRes.ok) {
          if (albumTracksRes.status === 429) {
            console.warn(`Rate limit al obtener tracks del álbum "${album.name}". Esperando...`)
            await new Promise(resolve => setTimeout(resolve, 5000))
            continue
          }
          continue
        }

        const albumTracksData = await albumTracksRes.json()

        if (albumTracksData.items) {
          for (const track of albumTracksData.items) {
            if (tracks.length >= limit) break
            if (seenTrackIds.has(track.id)) continue

            seenTrackIds.add(track.id)

            tracks.push({
              id: track.id,
              name: track.name,
              artist: track.artists?.[0]?.name || "Unknown",
              album: album.name,
              image: "/icon.png", // Se actualizará después
              duration_ms: track.duration_ms || 0,
              preview_url: undefined, // Se obtendrá después
              uri: track.uri,
            })
          }
        }
      } catch (error) {
        console.error(`Error obteniendo tracks del álbum "${album.name}":`, error)
        continue
      }
    }

    if (tracks.length === 0) {
      return []
    }

    // 4. Obtener información completa de tracks (1 request combinado, en lotes de 50)
    const trackIds = tracks.map(t => t.id).slice(0, 50)
    
      try {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Delay 5s antes del request para evitar rate limiting
        
        console.log(`[searchDalePlayTracksOptimized] 🎧 Obteniendo información completa de ${trackIds.length} tracks...`)
        const tracksInfoRes = await spotifyApiRequest(
          `/tracks?ids=${trackIds.join(',')}&market=US`,
          accessToken
        )

      if (tracksInfoRes.ok) {
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
      }
    } catch (error) {
      console.error("Error obteniendo información completa de tracks:", error)
    }

    // 5. Guardar en cache
    await saveDalePlayTracksToCache(tracks)

    return tracks.slice(0, limit)
  } catch (error) {
    console.error("Error en searchDalePlayTracksOptimized:", error)
    throw error
  }
}

/**
 * FUNCIÓN PRINCIPAL OPTIMIZADA: Busca artistas Y tracks compartiendo la búsqueda de álbumes
 * Esta función hace TODO en una sola pasada, minimizando requests
 */
export async function searchDalePlayDataOptimized(
  accessToken: string,
  artistsLimit: number = 10,
  tracksLimit: number = 25
): Promise<{ artists: Artist[]; tracks: Track[] }> {
  try {
    // 1. Buscar álbumes UNA SOLA VEZ
    const validatedAlbums = await searchAndValidateDalePlayAlbums(accessToken)

    if (validatedAlbums.length === 0) {
      // Si no hay álbumes, intentar usar cache
      const cachedArtists = await getCachedDalePlayArtists()
      const cachedTracks = await getCachedDalePlayTracks(tracksLimit)
      
      return {
        artists: cachedArtists?.slice(0, artistsLimit) || [],
        tracks: cachedTracks?.slice(0, tracksLimit) || [],
      }
    }

    // 2. Buscar artistas y tracks SECUENCIALMENTE (no en paralelo) para evitar rate limiting
    console.log(`[searchDalePlayDataOptimized] 🎯 Buscando artistas primero...`)
    const artists = await searchDalePlayArtistsOptimized(accessToken, artistsLimit, validatedAlbums)
    
    console.log(`[searchDalePlayDataOptimized] ⏳ Esperando 5s antes de buscar tracks...`)
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    console.log(`[searchDalePlayDataOptimized] 🎵 Buscando tracks ahora...`)
    const tracks = await searchDalePlayTracksOptimized(accessToken, tracksLimit, validatedAlbums)

    return { artists, tracks }
  } catch (error) {
    console.error("Error en searchDalePlayDataOptimized:", error)
    // Fallback: intentar usar cache
    const cachedArtists = await getCachedDalePlayArtists()
    const cachedTracks = await getCachedDalePlayTracks(tracksLimit)
    
    return {
      artists: cachedArtists?.slice(0, artistsLimit) || [],
      tracks: cachedTracks?.slice(0, tracksLimit) || [],
    }
  }
}

