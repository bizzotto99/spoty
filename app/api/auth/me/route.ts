import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("spotify_access_token")?.value

  if (!accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await response.json()
    return NextResponse.json({ authenticated: true, user })
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

