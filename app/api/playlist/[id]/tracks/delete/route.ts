import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { spotifyApiRequest } from "@/lib/spotify"

/**
 * API Route para eliminar tracks de una playlist en Spotify
 */
export async function DELETE(
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
    const { trackUris } = body

    if (!trackUris || !Array.isArray(trackUris) || trackUris.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un track URI para eliminar" },
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

    // Eliminar tracks de la playlist
    const deleteResponse = await spotifyApiRequest(
      `/playlists/${playlistId}/tracks`,
      accessToken,
      {
        method: "DELETE",
        body: JSON.stringify({
          tracks: trackUris.map((uri: string) => ({ uri })),
          snapshot_id: snapshotId,
        }),
      }
    )

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      return NextResponse.json(
        { error: `Error eliminando tracks: ${deleteResponse.status} ${errorText}` },
        { status: deleteResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Tracks eliminados exitosamente",
    })
  } catch (error) {
    console.error("Error eliminando tracks de playlist:", error)
    return NextResponse.json(
      {
        error: "Error eliminando tracks de la playlist",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

