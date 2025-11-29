import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value

  if (!accessToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    // Obtener solo datos esenciales en paralelo
    const [
      topTracksResponse,
      topArtistsResponse,
      recentlyPlayedResponse,
    ] = await Promise.all([
      // Top tracks (corto plazo - últimos 4 semanas)
      fetch("https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }),
      // Top artists (corto plazo)
      fetch("https://api.spotify.com/v1/me/top/artists?limit=20&time_range=short_term", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }),
      // Historial reciente
      fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      }),
    ])

    const topTracks = topTracksResponse.ok ? await topTracksResponse.json() : null
    const topArtists = topArtistsResponse.ok ? await topArtistsResponse.json() : null
    const recentlyPlayed = recentlyPlayedResponse.ok ? await recentlyPlayedResponse.json() : null

    // Obtener audio features de los top tracks (BPM, energía, etc.)
    let audioFeatures = null
    if (topTracks?.items && topTracks.items.length > 0) {
      const trackIds = topTracks.items.slice(0, 20).map((track: any) => track.id).join(',')
      const audioFeaturesResponse = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        }
      )
      audioFeatures = audioFeaturesResponse.ok ? await audioFeaturesResponse.json() : null
    }

    return NextResponse.json({
      topTracks,
      topArtists,
      recentlyPlayed,
      audioFeatures,
    })
  } catch (error) {
    console.error("Error obteniendo datos del usuario:", error)
    return NextResponse.json(
      { error: "Error al obtener datos del usuario" },
      { status: 500 }
    )
  }
}

