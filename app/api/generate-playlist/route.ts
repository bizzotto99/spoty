import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserSpotifyData } from "@/lib/get-user-data"
import { callGeminiAPI } from "@/lib/gemini"
import { searchTracksInSpotify } from "@/lib/search-tracks"

/**
 * API Route para generar playlist usando Gemini y Spotify
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

    // 3. Obtener datos del usuario de Spotify
    const userData = await getUserSpotifyData(accessToken)

    // 4. Llamar a Gemini para generar criterios
    const criteria = await callGeminiAPI(prompt.trim(), {
      topGenres: userData.topGenres,
      favoriteArtists: userData.favoriteArtists,
      musicPreferences: userData.musicPreferences,
    })

    // 5. Buscar tracks en Spotify basado en los criterios
    const favoriteArtistNames = userData.favoriteArtists.map((a) => a.name)
    const tracks = await searchTracksInSpotify(
      accessToken,
      criteria.criteria,
      favoriteArtistNames
    )

    if (tracks.length === 0) {
      return NextResponse.json(
        {
          error: "No se encontraron canciones que coincidan con los criterios",
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

