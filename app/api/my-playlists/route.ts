import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getUserBySpotifyId } from "@/lib/supabase-users"
import { getUserPlaylists } from "@/lib/supabase-playlists"

/**
 * API Route para obtener las playlists del usuario desde la base de datos
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Obtener token de acceso y user ID de las cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value
    const spotifyUserId = cookieStore.get("spotify_user_id")?.value

    if (!accessToken || !spotifyUserId) {
      return NextResponse.json(
        { error: "No autenticado. Por favor conecta tu cuenta de Spotify." },
        { status: 401 }
      )
    }

    // 2. Obtener el user_id (UUID) desde la base de datos
    const dbUser = await getUserBySpotifyId(spotifyUserId)
    
    if (!dbUser || !dbUser.id) {
      return NextResponse.json(
        { error: "Usuario no encontrado en la base de datos" },
        { status: 404 }
      )
    }

    // 3. Obtener las playlists del usuario desde Supabase
    const playlists = await getUserPlaylists(dbUser.id)

    // 4. Obtener información detallada de cada playlist desde Spotify
    const playlistsWithDetails = await Promise.all(
      playlists.map(async (playlist) => {
        try {
          const spotifyResponse = await fetch(
            `https://api.spotify.com/v1/playlists/${playlist.spotify_playlist_id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              cache: 'no-store',
            }
          )

          if (spotifyResponse.ok) {
            const spotifyData = await spotifyResponse.json()
            return {
              id: playlist.id,
              spotify_playlist_id: playlist.spotify_playlist_id,
              name: spotifyData.name,
              description: spotifyData.description || "",
              image: "/playlist.png",
              tracks_count: spotifyData.tracks?.total || 0,
              external_url: spotifyData.external_urls?.spotify || "",
              created_at: playlist.created_at,
            }
          } else {
            // Si no se puede obtener de Spotify, devolver datos básicos
            return {
              id: playlist.id,
              spotify_playlist_id: playlist.spotify_playlist_id,
              name: "Unknown Playlist",
              description: "",
              image: "/playlist.png",
              tracks_count: 0,
              external_url: "",
              created_at: playlist.created_at,
            }
          }
        } catch (error) {
          console.error(`Error obteniendo detalles de playlist ${playlist.spotify_playlist_id}:`, error)
          return {
            id: playlist.id,
            spotify_playlist_id: playlist.spotify_playlist_id,
            name: "Unknown Playlist",
            description: "",
            image: "/playlist.png",
            tracks_count: 0,
            external_url: "",
            created_at: playlist.created_at,
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      playlists: playlistsWithDetails,
    })
  } catch (error) {
    console.error("Error obteniendo playlists:", error)
    
    return NextResponse.json(
      {
        error: "Error obteniendo playlists",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

