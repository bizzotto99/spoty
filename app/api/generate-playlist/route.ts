import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { callGeminiAPI } from "@/lib/gemini"
import { searchDalePlayTracks, searchDalePlayArtists } from "@/lib/search-daleplay"
import type { Artist } from "@/lib/search-daleplay"

/**
 * API Route para generar playlist usando Gemini y tracks del label Dale Play
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

    // 3. Buscar artistas y tracks del label Dale Play
    const [dalePlayArtists, allDalePlayTracks] = await Promise.all([
      searchDalePlayArtists(accessToken, 100),
      searchDalePlayTracks(accessToken, 200), // Buscar más tracks para tener opciones
    ])

    // Extraer géneros de los artistas de Dale Play
    const dalePlayGenres: string[] = []
    dalePlayArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        if (!dalePlayGenres.includes(genre)) {
          dalePlayGenres.push(genre)
        }
      })
    })

    // 4. Llamar a Gemini para generar criterios usando datos de Dale Play
    const criteria = await callGeminiAPI(prompt.trim(), {
      topGenres: dalePlayGenres,
      favoriteArtists: dalePlayArtists.map(a => ({ name: a.name, genres: a.genres })),
      musicPreferences: {
        energy: "medium",
        tempo: "medium",
        mood: "upbeat",
      },
    })

    // 5. Filtrar tracks de Dale Play basado en los criterios de Gemini
    let filteredTracks = allDalePlayTracks
    const maxTracks = criteria.criteria.maxTracks || 30

    // Filtrar por géneros si están especificados en los criterios
    if (criteria.criteria.genres && criteria.criteria.genres.length > 0) {
      // Si tenemos criterios de géneros, priorizar tracks de artistas con esos géneros
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

    // Limitar a maxTracks
    const tracks = filteredTracks.slice(0, maxTracks)

    if (tracks.length === 0) {
      return NextResponse.json(
        {
          error: "No se encontraron canciones del label Dale Play que coincidan con los criterios",
          criteria,
        },
        { status: 404 }
      )
    }

    // 6. Retornar resultados
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

