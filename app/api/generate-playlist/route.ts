import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { extractDurationAndCalculateTracks } from "@/lib/openai"
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

    // 4. Llamar a OpenAI con SOLO el prompt y el nombre del label (SIN hacer requests a Spotify antes)
    console.log(`🤖 OpenAI seleccionando ${maxTracksNeeded} canciones específicas del label Dale Play Records...`)
    const trackSelection = await selectTracksWithOpenAI(
      prompt.trim(),
      {
        artists: [], // No enviamos artistas - OpenAI trabajará con solo el prompt y el nombre del label
        genres: [], // No enviamos géneros - se simplifica el flujo
      },
      maxTracksNeeded
    )
    

    // 6. Buscar SOLO las canciones específicas que OpenAI seleccionó en Spotify
    console.log(`🔍 Buscando ${trackSelection.tracks.length} canciones específicas en Spotify...`)
    
    // Validar y filtrar tracks con datos válidos
    const trackQueries = trackSelection.tracks
      .filter(t => {
        const isValid = t && 
          t.trackName && 
          typeof t.trackName === 'string' && 
          t.trackName.trim().length > 0 &&
          t.artistName && 
          typeof t.artistName === 'string' && 
          t.artistName.trim().length > 0
          
        if (!isValid) {
          console.warn(`[generate-playlist] ⚠️ Track inválido ignorado:`, t)
        }
        return isValid
      })
      .map(t => ({
        trackName: String(t.trackName).trim(),
        artistName: String(t.artistName).trim()
      }))

    if (trackQueries.length === 0) {
      return NextResponse.json(
        {
          error: "No se recibieron canciones válidas de OpenAI. Intenta con otro prompt.",
          selectedTracks: trackSelection.tracks,
        },
        { status: 400 }
      )
    }

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
