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
    // Validar que trackName y artistName sean strings válidos
    if (!trackName || typeof trackName !== 'string' || trackName.trim().length === 0) {
      console.warn(`[searchSingleTrack] ❌ trackName inválido:`, trackName)
      return null
    }
    
    if (!artistName || typeof artistName !== 'string' || artistName.trim().length === 0) {
      console.warn(`[searchSingleTrack] ❌ artistName inválido:`, artistName)
      return null
    }
    
    // Buscar track con query incluyendo el label
    // Estrategia: Buscar el track y luego verificar que pertenezca al label "Dale Play Records"
    const query = `track:"${trackName.trim()}" artist:"${artistName.trim()}"`
    console.log(`[searchSingleTrack] 🔍 Buscando: "${trackName}" de "${artistName}"`)
    
    let searchRes = await spotifyApiRequest(
      `/search?q=${encodeURIComponent(query)}&type=track&limit=20&market=US`,
      accessToken,
      { context: `searchSingleTrack - ${trackName} by ${artistName}` }
    )

    if (!searchRes.ok) {
      console.warn(`Error buscando track "${trackName}" de "${artistName}": ${searchRes.status}`)
      return null
    }

    const searchData = await searchRes.json()
    let tracks = searchData.tracks?.items || []

    // Si no encontró, intentar búsqueda más flexible (solo por track name)
    if (tracks.length === 0) {
      const queryAlt = `track:"${trackName.trim()}"`
      console.log(`[searchSingleTrack] 🔄 Búsqueda alternativa por track: "${trackName}"`)
      
      searchRes = await spotifyApiRequest(
        `/search?q=${encodeURIComponent(queryAlt)}&type=track&limit=20&market=US`,
        accessToken,
        { context: `searchSingleTrack alternative - ${trackName}` }
      )
      
      if (searchRes.ok) {
        const altData = await searchRes.json()
        tracks = altData.tracks?.items || []
      }
    }

    if (tracks.length === 0) {
      console.warn(`No se encontró track "${trackName}" de "${artistName}"`)
      return null
    }

    // Ordenar tracks por relevancia (coincidencia de artista)
    const normalizedSearchArtist = artistName.toLowerCase().trim()
    const sortedTracks = tracks.sort((a: any, b: any) => {
      const aArtist = (a.artists?.[0]?.name || "").toLowerCase()
      const bArtist = (b.artists?.[0]?.name || "").toLowerCase()
      const aMatches = aArtist.includes(normalizedSearchArtist) || normalizedSearchArtist.includes(aArtist)
      const bMatches = bArtist.includes(normalizedSearchArtist) || normalizedSearchArtist.includes(bArtist)
      
      if (aMatches && !bMatches) return -1
      if (!aMatches && bMatches) return 1
      return 0
    })

    // Verificar que el track pertenezca al label "Dale Play Records"
    // El label puede tener variaciones: "Dale Play Records", "DALE PLAY RECORDS", "dale play records", etc.
    const LABEL_NAME = "Dale Play Records"
    const labelVariations = [
      LABEL_NAME.toLowerCase(),
      LABEL_NAME.toUpperCase(),
      LABEL_NAME,
      "dale play records",
      "DALE PLAY RECORDS"
    ]

    for (const trackItem of sortedTracks) {
      if (!trackItem.album?.id) continue
      
      try {
        // Pequeño delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Obtener detalles del álbum para verificar el label
        const albumRes = await spotifyApiRequest(
          `/albums/${trackItem.album.id}?market=US`,
          accessToken,
          { context: `searchSingleTrack verify label - album ${trackItem.album.id}` }
        )
        
        if (albumRes.ok) {
          const albumDetails = await albumRes.json()
          const albumLabel = (albumDetails.label || "").toLowerCase().trim()
          
          // Verificar que el label contenga "dale play records" (case-insensitive)
          // Comparar con todas las variaciones posibles
          const belongsToLabel = labelVariations.some(variation => 
            albumLabel.includes(variation.toLowerCase())
          )
          
          if (belongsToLabel) {
            // Verificar que el artista también coincida (preferible)
            const trackArtist = (trackItem.artists?.[0]?.name || "").toLowerCase()
            const artistMatches = trackArtist.includes(normalizedSearchArtist) || 
                                 normalizedSearchArtist.includes(trackArtist)
            
            // Si hay múltiples tracks y este no coincide con el artista, continuar buscando
            // pero si es el único con el label correcto, aceptarlo
            if (!artistMatches && sortedTracks.length > 1) {
              // Buscar si hay otro track con label correcto que también coincida con el artista
              const hasBetterMatch = sortedTracks.some((t: any) => {
                if (t.id === trackItem.id) return false
                const tArtist = (t.artists?.[0]?.name || "").toLowerCase()
                return (tArtist.includes(normalizedSearchArtist) || normalizedSearchArtist.includes(tArtist))
              })
              
              if (hasBetterMatch) {
                continue // Hay mejor coincidencia, continuar buscando
              }
            }
            
            // Track válido del label
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
            
            console.log(`✅ Track encontrado y verificado del label "${LABEL_NAME}": "${track.name}" de "${track.artist}"`)
            return track
          }
        }
      } catch (error) {
        console.warn(`Error verificando label para track "${trackItem.name}":`, error)
        continue
      }
    }

    // Si no encontramos ningún track con el label correcto
    console.warn(`❌ Track "${trackName}" de "${artistName}" encontrado pero NO pertenece al label "${LABEL_NAME}"`)
    return null
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
