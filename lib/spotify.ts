/**
 * Utilidades para interactuar con la API de Spotify
 */

export interface SpotifyToken {
  access_token: string
  refresh_token?: string
  expires_in: number
}

/**
 * Refresca el token de acceso usando el refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyToken> {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET no están configurados")
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error("Error al refrescar el token")
  }

  return response.json()
}

/**
 * Hace una petición a la API de Spotify con manejo automático de tokens y rate limiting
 */
export async function spotifyApiRequest(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {},
  retryCount: number = 0
): Promise<Response> {
  const maxRetries = 3
  const baseDelay = 1000 // 1 segundo base

  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  // Manejar rate limiting (429 Too Many Requests)
  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After")
    let waitTime: number
    
    if (retryAfter) {
      const retryAfterSeconds = parseInt(retryAfter, 10)
      // Validar que el valor sea razonable (máximo 60 segundos)
      // Si el valor es muy grande, usar un valor por defecto
      if (isNaN(retryAfterSeconds) || retryAfterSeconds > 60 || retryAfterSeconds < 0) {
        console.warn(`Retry-After inválido o muy grande (${retryAfter}), usando 10 segundos por defecto`)
        waitTime = 10000 // 10 segundos
      } else {
        waitTime = retryAfterSeconds * 1000
      }
    } else {
      // Si no hay Retry-After, usar exponential backoff
      waitTime = Math.min(baseDelay * Math.pow(2, retryCount), 30000) // Máximo 30 segundos
    }
    
    if (retryCount < maxRetries) {
      const waitTimeSeconds = (waitTime / 1000).toFixed(1)
      console.log(`[Spotify API] Rate limit alcanzado. Esperando ${waitTimeSeconds}s antes de reintentar... (intento ${retryCount + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return spotifyApiRequest(endpoint, accessToken, options, retryCount + 1)
    } else {
      throw new Error("Rate limit excedido después de múltiples intentos. Por favor intenta más tarde.")
    }
  }

  if (response.status === 401) {
    // Token expirado, habría que refrescar aquí
    throw new Error("Token expirado")
  }

  return response
}

