import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { searchDalePlayArtists } from "@/lib/search-daleplay"
import { selectTracksWithOpenAI } from "@/lib/openai-select-tracks"
import { searchSpecificTracks } from "@/lib/search-specific-tracks"
import { extractDurationAndCalculateTracks } from "@/lib/openai"

// Configurar tiempo máximo de ejecución: 300 segundos (5 minutos)
export const maxDuration = 300

/**
 * API Route para generar playlist usando OpenAI para seleccionar tracks directamente
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

    // 3. Calcular cantidad de tracks basado en duración del prompt
    const maxTracks = extractDurationAndCalculateTracks(prompt.trim())

    // 4. Obtener SOLO artistas del label (sin buscar todos los tracks - esto reduce drásticamente las requests)
    const dalePlayArtists = await searchDalePlayArtists(accessToken, 30) // Solo necesitamos metadata de artistas

    // Extraer géneros de los artistas
    const dalePlayGenres: string[] = []
    dalePlayArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        if (!dalePlayGenres.includes(genre)) {
          dalePlayGenres.push(genre)
        }
      })
    })

    if (dalePlayArtists.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron artistas del label Dale Play Records" },
        { status: 404 }
      )
    }

    // 5. Llamar a OpenAI para que seleccione DIRECTAMENTE las canciones
    console.log(`🎵 OpenAI seleccionará ${maxTracks} canciones específicas...`)
    const trackSelection = await selectTracksWithOpenAI(
      prompt.trim(),
      dalePlayArtists.map(a => ({ name: a.name, genres: a.genres })),
      dalePlayGenres,
      maxTracks
    )

    // 6. Buscar SOLO las canciones que OpenAI seleccionó en Spotify
    console.log(`🔍 Buscando ${trackSelection.tracks.length} canciones en Spotify...`)
    const trackQueries = trackSelection.tracks.map(t => ({
      trackName: t.trackName,
      artistName: t.artistName
    }))

    const foundTracks = await searchSpecificTracks(trackQueries, accessToken)

    if (foundTracks.length === 0) {
      return NextResponse.json(
        {
          error: "No se encontraron las canciones seleccionadas en Spotify. Intenta con otro prompt.",
          selectedTracks: trackSelection.tracks.map(t => `${t.trackName} - ${t.artistName}`),
        },
        { status: 404 }
      )
    }

    // 7. Retornar resultados
    console.log(`✅ Playlist generada: ${trackSelection.playlistName} con ${foundTracks.length} canciones`)
    return NextResponse.json({
      success: true,
      playlistName: trackSelection.playlistName,
      description: trackSelection.description,
      tracks: foundTracks,
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

