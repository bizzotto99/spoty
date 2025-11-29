import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Spotify OAuth callback handler

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "https://spoty-three.vercel.app/api/auth/callback"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // Verificar si hubo un error en el flujo OAuth
  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  // Verificar que tengamos el código y el state
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/?error=missing_code_or_state", request.url)
    )
  }

  // Verificar el state guardado en cookies
  const cookieStore = await cookies()
  const savedState = cookieStore.get("spotify_auth_state")?.value

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/?error=invalid_state", request.url)
    )
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/?error=server_config_error", request.url)
    )
  }

  try {
    // Intercambiar el código por tokens
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL("/?error=token_exchange_failed", request.url)
      )
    }

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL("/?error=no_access_token", request.url)
      )
    }

    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
      cache: 'no-store',
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL("/?error=user_fetch_failed", request.url)
      )
    }

    const user = await userResponse.json()

    // Determinar configuración de cookies y dominio
    const isProduction = process.env.NODE_ENV === "production"
    const isSecure = isProduction || request.url.startsWith("https://")
    
    // Siempre redirigir a "/" para evitar problemas con rutas que no existen
    const redirectUrl = new URL("/?connected=true", request.url)
    const response = NextResponse.redirect(redirectUrl)
    
    const expiresInSeconds = tokens.expires_in || 3600
    const refreshTokenMaxAge = 60 * 60 * 24 * 365
    const userIdMaxAge = 60 * 60 * 24 * 365
    
    response.cookies.set("spotify_access_token", tokens.access_token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: expiresInSeconds,
    })

    response.cookies.set("spotify_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: refreshTokenMaxAge,
    })

    response.cookies.set("spotify_user_id", user.id, {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: userIdMaxAge,
    })

    response.cookies.delete("spotify_auth_state")
    response.cookies.delete("spotify_return_to")
    
    return response
  } catch (error) {
    return NextResponse.redirect(
      new URL("/?error=callback_error", request.url)
    )
  }
}

