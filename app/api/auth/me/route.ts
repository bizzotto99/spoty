import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value
  
  // Debug: ver todas las cookies disponibles
  const allCookies = cookieStore.getAll()
  console.log("🔍 All cookies:", allCookies.map(c => c.name).join(", "))
  console.log("🔍 Access token present:", !!accessToken)

  if (!accessToken) {
    console.log("❌ No access token found in cookies")
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.log("❌ Spotify API error:", response.status, response.statusText)
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await response.json()
    console.log("✅ User verified:", user.id, user.display_name)
    return NextResponse.json({ authenticated: true, user })
  } catch (error) {
    console.error("❌ Error al obtener usuario:", error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

