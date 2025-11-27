import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Check user authentication status endpoint

export async function GET(request: NextRequest) {
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
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await response.json()
    return NextResponse.json({ authenticated: true, user })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

