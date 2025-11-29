import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { callOpenAIAPI } from "@/lib/openai"
import { searchDalePlayTracks, searchDalePlayArtists } from "@/lib/search-daleplay"
import { spotifyApiRequest } from "@/lib/spotify"

// Configurar tiempo máximo de ejecución: 300 segundos (5 minutos)
export const maxDuration = 300

// Función para mezclar array aleatoriamente (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[], seed?: string): T[] {
  const shuffled = [...array]
  
  // Si hay seed, usarla para hacer la aleatoriedad determinista pero variada
  let random: () => number
  if (seed) {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    let seedValue = Math.abs(hash) / 2147483647
    random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280
      return seedValue / 233280
    }
  } else {
    random = Math.random
  }
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

/**
 * API Route para generar playlist usando OpenAI (igual que Gemini) - genera criterios y filtra tracks reales
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener token de acceso de las cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "No autenticado. Por favor conecta tu cuenta de Spotify." },
        { status: 401 }
      )
    }

    // 2. Obtener el prompt del body
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "El prompt es requerido" },
        { status: 400 }
      )
    }

    // 3. Buscar artistas y tracks del label "Dale Play Records" (optimizado)
    console.log("🔍 Buscando artistas y tracks de Dale Play Records...")
    const dalePlayArtists = await searchDalePlayArtists(accessToken, 15) // Reducido para menos requests
    const allDalePlayTracks = await searchDalePlayTracks(accessToken, 50) // Reducido de 200 a 50 tracks

    // Extraer géneros de los artistas de Dale Play
    const dalePlayGenres: string[] = []
    dalePlayArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        if (!dalePlayGenres.includes(genre)) {
          dalePlayGenres.push(genre)
        }
      })
    })

    if (dalePlayArtists.length === 0 || allDalePlayTracks.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron artistas o tracks del label Dale Play Records" },
        { status: 404 }
      )
    }

    // 4. Llamar a OpenAI para generar criterios (igual que Gemini hacía)
    console.log("🤖 OpenAI generando criterios de búsqueda...")
    const criteria = await callOpenAIAPI(prompt.trim(), {
      topGenres: dalePlayGenres,
      favoriteArtists: dalePlayArtists.map(a => ({ name: a.name, genres: a.genres })),
      musicPreferences: {
        energy: "medium",
        tempo: "medium",
        mood: "upbeat",
      },
    })

    // 5. Filtrar tracks de Dale Play basado en los criterios de OpenAI
    const dalePlayArtistNames = new Set(
      dalePlayArtists.map(artist => artist.name.toLowerCase())
    )
    
    // Asegurar que TODOS los tracks sean de artistas de Dale Play
    let filteredTracks = allDalePlayTracks.filter(track => {
      const trackArtistLower = track.artist.toLowerCase()
      return dalePlayArtistNames.has(trackArtistLower) ||
             Array.from(dalePlayArtistNames).some(dalePlayArtist => 
               trackArtistLower.includes(dalePlayArtist) || 
               dalePlayArtist.includes(trackArtistLower)
             )
    })
    
    const maxTracks = criteria.criteria.maxTracks || 30

    // Filtrar por géneros si están especificados en los criterios
    if (criteria.criteria.genres && criteria.criteria.genres.length > 0) {
      const matchingArtistIds = new Set(
        dalePlayArtists
          .filter(artist => 
            artist.genres.some(genre => 
              criteria.criteria.genres?.some(cg => 
                genre.toLowerCase().includes(cg.toLowerCase()) || 
                cg.toLowerCase().includes(genre.toLowerCase())
              )
            )
          )
          .map(artist => artist.id)
      )
      
      // Priorizar tracks de artistas que coinciden con los géneros
      filteredTracks.sort((a, b) => {
        const aArtist = dalePlayArtists.find(artist => artist.name === a.artist)
        const bArtist = dalePlayArtists.find(artist => artist.name === b.artist)
        const aMatches = aArtist && matchingArtistIds.has(aArtist.id)
        const bMatches = bArtist && matchingArtistIds.has(bArtist.id)
        
        if (aMatches && !bMatches) return -1
        if (!aMatches && bMatches) return 1
        return 0
      })
    }

    // Filtrar por artistas específicos si están en los criterios
    if (criteria.criteria.artists && criteria.criteria.artists.length > 0) {
      filteredTracks = filteredTracks.filter(track => 
        criteria.criteria.artists?.some(criteriaArtist =>
          track.artist.toLowerCase().includes(criteriaArtist.toLowerCase()) ||
          criteriaArtist.toLowerCase().includes(track.artist.toLowerCase())
        )
      )
    }

    // 6. Obtener audio features (BPM) de todos los tracks filtrados
    const audioFeaturesMap = new Map<string, { tempo: number; energy?: number; danceability?: number }>()
    
    if (filteredTracks.length > 0 && criteria.criteria.bpmRange) {
      // Obtener audio features en lotes de 100 (límite de Spotify)
      const trackIds = filteredTracks.map(t => t.id)
      const chunks = []
      for (let i = 0; i < trackIds.length; i += 100) {
        chunks.push(trackIds.slice(i, i + 100))
      }
      
      for (const chunk of chunks) {
        try {
          // Agregar delay entre lotes de audio features
          if (chunks.indexOf(chunk) > 0) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }

          const featuresRes = await spotifyApiRequest(
            `/audio-features?ids=${chunk.join(',')}`,
            accessToken
          )
          const featuresData = await featuresRes.json()
          
          if (featuresData.audio_features) {
            featuresData.audio_features.forEach((feature: any) => {
              if (feature && feature.id && feature.tempo) {
                audioFeaturesMap.set(feature.id, {
                  tempo: feature.tempo,
                  energy: feature.energy,
                  danceability: feature.danceability,
                })
              }
            })
          }
        } catch (error) {
          console.error("Error obteniendo audio features:", error)
        }
      }
      
      // Filtrar tracks por BPM ANTES de seleccionar
      const [minBPM, maxBPM] = criteria.criteria.bpmRange
      filteredTracks = filteredTracks.filter(track => {
        const features = audioFeaturesMap.get(track.id)
        if (!features || !features.tempo) {
          console.warn(`Track "${track.name}" no tiene BPM disponible, excluido`)
          return false
        }
        
        const isInRange = features.tempo >= minBPM && features.tempo <= maxBPM
        if (!isInRange) {
          console.log(`Track "${track.name}" tiene BPM ${features.tempo.toFixed(1)} (fuera de rango ${minBPM}-${maxBPM})`)
        }
        return isInRange
      })
      
      console.log(`Filtrado por BPM ${minBPM}-${maxBPM}: ${filteredTracks.length} tracks disponibles`)
    }

    // 7. Mezclar aleatoriamente los tracks para variar la selección
    const shuffledTracks = shuffleArray(filteredTracks, prompt.trim())

    // 8. Seleccionar tracks asegurando diversidad de artistas
    const selectedTracks: typeof filteredTracks = []
    const artistCountMap = new Map<string, number>()
    const recentArtists: string[] = []
    const maxConsecutiveSameArtist = 2

    for (const track of shuffledTracks) {
      if (selectedTracks.length >= maxTracks) break
      
      const artistKey = track.artist.toLowerCase()
      const recentCount = recentArtists.filter(a => a === artistKey).length
      
      // Evitar más de maxConsecutiveSameArtist canciones del mismo artista seguidas
      if (recentCount >= maxConsecutiveSameArtist) {
        continue
      }
      
      // Limitar cantidad total de canciones por artista
      const artistTrackCount = artistCountMap.get(artistKey) || 0
      const maxTracksPerArtist = maxTracks > 30 ? 5 : 3
      
      if (artistTrackCount >= maxTracksPerArtist) {
        continue
      }
      
      // Agregar el track
      selectedTracks.push(track)
      artistCountMap.set(artistKey, artistTrackCount + 1)
      
      // Actualizar lista de artistas recientes
      recentArtists.push(artistKey)
      if (recentArtists.length > maxConsecutiveSameArtist) {
        recentArtists.shift()
      }
    }

    // Si no alcanzamos el número deseado, agregar tracks restantes
    if (selectedTracks.length < maxTracks) {
      for (const track of shuffledTracks) {
        if (selectedTracks.length >= maxTracks) break
        if (!selectedTracks.find(t => t.id === track.id)) {
          selectedTracks.push(track)
        }
      }
    }

    // Mezclar una vez más para distribuir mejor los artistas
    const tracks = shuffleArray(selectedTracks)

    if (tracks.length === 0) {
      return NextResponse.json(
        {
          error: "No se encontraron canciones del label Dale Play que coincidan con los criterios",
          criteria,
        },
        { status: 404 }
      )
    }

    // 9. Retornar resultados
    console.log(`✅ Playlist generada: ${criteria.playlistName} con ${tracks.length} canciones`)
    return NextResponse.json({
      success: true,
      playlistName: criteria.playlistName,
      description: criteria.description,
      tracks,
      criteria,
    })
  } catch (error) {
    console.error("Error generando playlist:", error)
    
    return NextResponse.json(
      {
        error: "Error generando playlist",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
