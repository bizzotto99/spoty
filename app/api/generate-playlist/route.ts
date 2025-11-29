import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { extractDurationAndCalculateTracks } from "@/lib/openai"
import { selectTracksWithOpenAI } from "@/lib/openai-track-selection"
import { searchSpecificTracks } from "@/lib/search-specific-tracks"

// Configurar tiempo máximo de ejecución: 300 segundos (5 minutos)
export const maxDuration = 300

/**
 * API Route para generar playlist usando OpenAI
 * 
 * FLUJO OPTIMIZADO:
 * 1. OpenAI selecciona tracks específicos basado en el prompt (0 requests a Spotify)
 * 2. Buscamos SOLO esos tracks en Spotify
 * 3. Retornamos tracks encontrados
 * 
 * Esto minimiza requests: solo buscamos lo que OpenAI seleccionó
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

    // 3. Calcular cantidad de tracks necesarios
    const maxTracksNeeded = extractDurationAndCalculateTracks(prompt.trim())
    console.log(`📊 Playlist solicitada: ${maxTracksNeeded} canciones`)

    // 4. OPENAI SELECCIONA TRACKS ESPECÍFICOS (0 requests a Spotify)
    console.log(`🤖 OpenAI seleccionando ${maxTracksNeeded} canciones del label Dale Play Records...`)
    const selection = await selectTracksWithOpenAI(
      prompt.trim(),
      "Dale Play Records",
      maxTracksNeeded
    )

    if (!selection.tracks || selection.tracks.length === 0) {
      return NextResponse.json(
        { error: "OpenAI no pudo generar una lista de canciones. Intenta con otro prompt." },
        { status: 400 }
      )
    }

    // 5. BUSCAR SOLO LOS TRACKS QUE OPENAI SELECCIONÓ
    console.log(`🔍 Buscando ${selection.tracks.length} canciones específicas en Spotify...`)
    
    // Validar y preparar queries
    const trackQueries = selection.tracks
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
          selectedTracks: selection.tracks,
        },
        { status: 400 }
      )
    }

    // Buscar tracks en Spotify (SOLO estos, no pre-cargamos catálogo)
    const tracks = await searchSpecificTracks(trackQueries, accessToken)

    if (tracks.length === 0) {
      return NextResponse.json(
        {
          error: "No se encontraron las canciones seleccionadas en Spotify. Intenta con otro prompt.",
          selectedTracks: selection.tracks.map(t => `${t.trackName} - ${t.artistName}`),
        },
        { status: 404 }
      )
    }

    // 6. RETORNAR RESULTADOS
    console.log(`✅ Playlist generada: ${selection.playlistName} con ${tracks.length} canciones`)
    console.log(`📊 RESUMEN:`)
    console.log(`   - Tracks sugeridos por OpenAI: ${selection.tracks.length}`)
    console.log(`   - Tracks encontrados en Spotify: ${tracks.length}`)
    console.log(`   - Requests a Spotify API: ${trackQueries.length} búsquedas`)
    
    return NextResponse.json({
      success: true,
      playlistName: selection.playlistName,
      description: selection.description,
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
