import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * API Route para obtener los tracks de una playlist específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value
    const { id: playlistId } = await params

    if (!accessToken) {
      return NextResponse.json(
        { error: "No autenticado. Por favor conecta tu cuenta de Spotify." },
        { status: 401 }
      )
    }

    if (!playlistId) {
      return NextResponse.json(
        { error: "ID de playlist requerido" },
        { status: 400 }
      )
    }

    // Obtener tracks de la playlist desde Spotify
    const tracksResponse = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&market=US`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: 'no-store',
      }
    )

    if (!tracksResponse.ok) {
      const errorText = await tracksResponse.text()
      return NextResponse.json(
        { error: `Error obteniendo tracks: ${tracksResponse.status} ${errorText}` },
        { status: tracksResponse.status }
      )
    }

    const tracksData = await tracksResponse.json()

    // Formatear tracks para el frontend
    const tracks = tracksData.items
      .filter((item: any) => item.track && !item.track.is_local) // Filtrar tracks locales
      .map((item: any, index: number) => {
        const track = item.track
        return {
          id: track.id,
          name: track.name,
          artist: track.artists?.[0]?.name || "Unknown Artist",
          album: track.album?.name || "Unknown Album",
          image: track.album?.images?.[0]?.url || "/playlist.png",
          duration_ms: track.duration_ms || 0,
          preview_url: track.preview_url || null,
          uri: track.uri,
          added_at: item.added_at,
          position: index,
        }
      })

    return NextResponse.json({
      success: true,
      tracks,
      total: tracksData.total || tracks.length,
    })
  } catch (error) {
    console.error("Error obteniendo tracks de playlist:", error)
    return NextResponse.json(
      {
        error: "Error obteniendo tracks de la playlist",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

