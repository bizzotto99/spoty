import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { extractDurationAndCalculateTracks } from "@/lib/openai"
import { searchDalePlayArtistsOptimized } from "@/lib/search-daleplay-optimized"
import { selectTracksWithOpenAI } from "@/lib/openai-track-selection"
import { searchSpecificTracks } from "@/lib/search-specific-tracks"

// Configurar tiempo máximo de ejecución: 300 segundos (5 minutos)
export const maxDuration = 300

/**
 * API Route para generar playlist usando OpenAI
 * Flujo optimizado: OpenAI selecciona canciones específicas, luego las buscamos en Spotify
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

    // 3. Calcular cantidad de tracks necesarios primero
    const maxTracksNeeded = extractDurationAndCalculateTracks(prompt.trim())

    // 4. Obtener SOLO artistas del label (para contexto de OpenAI) - NO buscamos tracks todavía
    console.log(`🔍 Obteniendo artistas del label Dale Play Records para contexto...`)
    const dalePlayArtists = await searchDalePlayArtistsOptimized(accessToken, 15) // Obtener más artistas para contexto

    if (dalePlayArtists.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron artistas del label Dale Play Records" },
        { status: 404 }
      )
    }

    // Extraer géneros de los artistas de Dale Play
    const dalePlayGenres: string[] = []
    dalePlayArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        if (!dalePlayGenres.includes(genre)) {
          dalePlayGenres.push(genre)
        }
      })
    })

    // 5. Llamar a OpenAI para que seleccione canciones ESPECÍFICAS del label
    console.log(`🤖 OpenAI seleccionando ${maxTracksNeeded} canciones específicas del label...`)
    const trackSelection = await selectTracksWithOpenAI(
      prompt.trim(),
      {
        artists: dalePlayArtists.map(a => ({ name: a.name, genres: a.genres })),
        genres: dalePlayGenres,
      },
      maxTracksNeeded
    )

    // 6. Buscar SOLO las canciones específicas que OpenAI seleccionó en Spotify
    console.log(`🔍 Buscando ${trackSelection.tracks.length} canciones específicas en Spotify...`)
    const trackQueries = trackSelection.tracks.map(t => ({
      trackName: t.trackName,
      artistName: t.artistName
    }))

    const tracks = await searchSpecificTracks(trackQueries, accessToken)

    if (tracks.length === 0) {
      return NextResponse.json(
        {
          error: "No se encontraron las canciones seleccionadas en Spotify. Intenta con otro prompt.",
          selectedTracks: trackSelection.tracks.map(t => `${t.trackName} - ${t.artistName}`),
        },
        { status: 404 }
      )
    }

    // 7. Retornar resultados
    console.log(`✅ Playlist generada: ${trackSelection.playlistName} con ${tracks.length} canciones`)
    return NextResponse.json({
      success: true,
      playlistName: trackSelection.playlistName,
      description: trackSelection.description,
      tracks,
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
