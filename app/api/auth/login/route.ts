import { NextResponse } from "next/server"

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3000/api/auth/callback"
const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-read-recently-played",
  "user-top-read",
  "user-read-playback-state",
  "playlist-modify-public",
  "playlist-modify-private",
  "playlist-read-private",
].join(" ")

export async function GET() {
  if (!SPOTIFY_CLIENT_ID) {
    return NextResponse.json(
      { error: "SPOTIFY_CLIENT_ID no está configurado" },
      { status: 500 }
    )
  }

  // Generar un state aleatorio para seguridad
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
  // Guardar el state en cookies para verificarlo en el callback
  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?` +
    `client_id=${SPOTIFY_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(SPOTIFY_SCOPES)}&` +
    `state=${state}&` +
    `show_dialog=true`
  )

  // Guardar el state en una cookie httpOnly
  response.cookies.set("spotify_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutos
  })

  return response
}

