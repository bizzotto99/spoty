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
    const waitTime = retryAfter 
      ? parseInt(retryAfter, 10) * 1000 
      : baseDelay * Math.pow(2, retryCount)
    
    if (retryCount < maxRetries) {
      console.log(`Rate limit alcanzado. Esperando ${waitTime}ms antes de reintentar...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return spotifyApiRequest(endpoint, accessToken, options, retryCount + 1)
    } else {
      throw new Error("Rate limit excedido después de múltiples intentos")
    }
  }

  if (response.status === 401) {
    // Token expirado, habría que refrescar aquí
    throw new Error("Token expirado")
  }

  return response
}

