import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createPlaylistInSpotify } from "@/lib/create-playlist"
import { getUserBySpotifyId } from "@/lib/supabase-users"
import { createPlaylist as createPlaylistInDB } from "@/lib/supabase-playlists"

/**
 * API Route para crear la playlist en Spotify del usuario
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener token de acceso y user ID de las cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value
    const userId = cookieStore.get("spotify_user_id")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "No autenticado. Por favor conecta tu cuenta de Spotify." },
        { status: 401 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: "No se encontró el ID de usuario" },
        { status: 401 }
      )
    }

    // 2. Obtener datos del body
    const body = await request.json()
    const { name, description, tracks } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre de la playlist es requerido" },
        { status: 400 }
      )
    }

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos una canción" },
        { status: 400 }
      )
    }

    // 3. Convertir tracks a formato de URI de Spotify
    const trackUris = tracks.map((track: any) => {
      if (typeof track === "string") {
        // Si es un URI directamente
        if (track.startsWith("spotify:track:")) {
          return { uri: track }
        }
        // Si es un ID, convertirlo a URI
        return { uri: `spotify:track:${track}` }
      }
      // Si es un objeto con uri o id
      if (track.uri) {
        return { uri: track.uri }
      }
      if (track.id) {
        return { uri: `spotify:track:${track.id}` }
      }
      return null
    }).filter(Boolean) as Array<{ uri: string }>

    if (trackUris.length === 0) {
      return NextResponse.json(
        { error: "No se pudieron procesar los tracks" },
        { status: 400 }
      )
    }

    // 4. Crear la playlist con imagen por defecto
    const result = await createPlaylistInSpotify(accessToken, userId, {
      name: name.trim(),
      description: description || "",
      tracks: trackUris,
      isPublic: true,
      imagePath: "playlist.png", // Imagen por defecto para todas las playlists
    })

    // 5. Guardar la playlist en la base de datos
    try {
      // Obtener el user_id (UUID) desde la base de datos usando el spotify_user_id
      const dbUser = await getUserBySpotifyId(userId)
      
      if (dbUser && dbUser.id) {
        // Guardar la playlist en Supabase
        await createPlaylistInDB({
          spotify_playlist_id: result.id,
          user_id: dbUser.id,
        })
        console.log(`Playlist ${result.id} guardada en base de datos para usuario ${dbUser.id}`)
      } else {
        console.warn(`Usuario con spotify_user_id ${userId} no encontrado en base de datos. La playlist se creó en Spotify pero no se guardó en DB.`)
      }
    } catch (dbError) {
      // No fallar si hay error de base de datos, solo loguear
      console.error("Error guardando playlist en base de datos:", dbError)
      // La playlist ya está creada en Spotify, así que continuamos
    }

    // 6. Retornar resultado
    return NextResponse.json({
      success: true,
      playlistId: result.id,
      playlistUrl: result.url,
    })
  } catch (error) {
    console.error("Error creando playlist:", error)
    
    return NextResponse.json(
      {
        error: "Error creando playlist",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

