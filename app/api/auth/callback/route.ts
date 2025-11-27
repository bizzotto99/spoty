import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3000/api/auth/callback"

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
    console.log("❌ Invalid state - saved:", savedState, "received:", state)
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
    console.log("🔄 Exchanging authorization code for tokens...")
    console.log("🔍 Redirect URI used:", SPOTIFY_REDIRECT_URI)
    console.log("🔍 Code length:", code.length)
    
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
      const errorText = await tokenResponse.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = errorText
      }
      console.error("❌ Error exchanging code for tokens:")
      console.error("   Status:", tokenResponse.status, tokenResponse.statusText)
      console.error("   Error data:", errorData)
      console.error("   Redirect URI:", SPOTIFY_REDIRECT_URI)
      return NextResponse.redirect(
        new URL("/?error=token_exchange_failed", request.url)
      )
    }

    const tokens = await tokenResponse.json()
    console.log("✅ Tokens obtained successfully")
    console.log("🔍 Access token length:", tokens.access_token?.length || 0)
    console.log("🔍 Token type:", tokens.token_type)
    console.log("🔍 Expires in:", tokens.expires_in)

    // Obtener información del usuario
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("❌ Error fetching user from Spotify:")
      console.error("   Status:", userResponse.status, userResponse.statusText)
      console.error("   Response:", errorText)
      console.error("   Access token present:", !!tokens.access_token)
      console.error("   Access token starts with:", tokens.access_token?.substring(0, 20) || "none")
      
      return NextResponse.redirect(
        new URL("/?error=user_fetch_failed", request.url)
      )
    }

    const user = await userResponse.json()
    console.log("✅ User data fetched successfully:", user.id)

    // Determinar configuración de cookies
    const isProduction = process.env.NODE_ENV === "production"
    const isSecure = isProduction || request.url.startsWith("https://")
    
    // Crear la URL de redirect usando new URL con la request.url como base
    const redirectUrl = new URL("/?connected=true", request.url)
    
    // Crear la respuesta de redirect
    const response = NextResponse.redirect(redirectUrl)
    
    // Configuración base para cookies
    const cookieBaseOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax" as const,
      path: "/",
    }
    
    // Establecer cookies en la respuesta ANTES de eliminar la cookie del state
    response.cookies.set("spotify_access_token", tokens.access_token, {
      ...cookieBaseOptions,
      maxAge: tokens.expires_in || 3600,
    })

    response.cookies.set("spotify_refresh_token", tokens.refresh_token, {
      ...cookieBaseOptions,
      maxAge: 60 * 60 * 24 * 365, // 1 año
    })

    response.cookies.set("spotify_user_id", user.id, {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })

    // Eliminar el state de la cookie ya que fue usado
    response.cookies.delete("spotify_auth_state")

    console.log("✅ User authenticated:", user.id, user.display_name)
    console.log("🔧 Cookie settings - secure:", isSecure, "production:", isProduction)
    console.log("🔧 Redirect URL:", redirectUrl.toString())
    console.log("🍪 Cookies set: access_token, refresh_token, user_id")
    console.log("🍪 Cookie values - access_token length:", tokens.access_token.length)
    return response
  } catch (error) {
    console.error("Error en el callback:", error)
    return NextResponse.redirect(
      new URL("/?error=callback_error", request.url)
    )
  }
}

