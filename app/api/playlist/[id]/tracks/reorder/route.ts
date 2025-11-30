import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { spotifyApiRequest } from "@/lib/spotify"

/**
 * API Route para reordenar tracks en una playlist en Spotify
 */
export async function PUT(
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

    const body = await request.json()
    const { rangeStart, insertBefore, rangeLength = 1 } = body

    if (rangeStart === undefined || insertBefore === undefined) {
      return NextResponse.json(
        { error: "rangeStart e insertBefore son requeridos" },
        { status: 400 }
      )
    }

    // Obtener snapshot_id de la playlist primero
    const playlistResponse = await spotifyApiRequest(
      `/playlists/${playlistId}`,
      accessToken,
      { cache: 'no-store' }
    )

    if (!playlistResponse.ok) {
      const errorText = await playlistResponse.text()
      return NextResponse.json(
        { error: `Error obteniendo playlist: ${playlistResponse.status} ${errorText}` },
        { status: playlistResponse.status }
      )
    }

    const playlistData = await playlistResponse.json()
    const snapshotId = playlistData.snapshot_id

    // Reordenar tracks en la playlist
    const reorderResponse = await spotifyApiRequest(
      `/playlists/${playlistId}/tracks`,
      accessToken,
      {
        method: "PUT",
        body: JSON.stringify({
          range_start: rangeStart,
          insert_before: insertBefore,
          range_length: rangeLength,
          snapshot_id: snapshotId,
        }),
      }
    )

    if (!reorderResponse.ok) {
      const errorText = await reorderResponse.text()
      return NextResponse.json(
        { error: `Error reordenando tracks: ${reorderResponse.status} ${errorText}` },
        { status: reorderResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Tracks reordenados exitosamente",
    })
  } catch (error) {
    console.error("Error reordenando tracks de playlist:", error)
    return NextResponse.json(
      {
        error: "Error reordenando tracks de la playlist",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

