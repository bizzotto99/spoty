import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()
  
  // Eliminar todas las cookies de Spotify
  cookieStore.delete("spotify_access_token")
  cookieStore.delete("spotify_refresh_token")
  cookieStore.delete("spotify_user_id")

  return NextResponse.json({ success: true })
}

