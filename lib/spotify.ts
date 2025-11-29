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
  const maxRetries = 5 // Aumentar reintentos para rate limiting
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
      const retryAfterValue = parseInt(retryAfter, 10)
      
      // Spotify puede devolver Retry-After en segundos o milisegundos
      // Si el valor es > 1000, probablemente esté en milisegundos
      if (!isNaN(retryAfterValue) && retryAfterValue > 1000) {
        // Probablemente está en milisegundos, usar directamente
        waitTime = retryAfterValue
        console.log(`[Spotify API] Retry-After interpretado como ms: ${waitTime}ms (${(waitTime / 1000).toFixed(1)}s)`)
      } else if (!isNaN(retryAfterValue) && retryAfterValue >= 0) {
        // Está en segundos, convertir a milisegundos
        waitTime = retryAfterValue * 1000
        console.log(`[Spotify API] Retry-After en segundos: ${retryAfterValue}s`)
      } else {
        // Valor inválido, usar exponential backoff
        waitTime = Math.min(baseDelay * Math.pow(2, retryCount), 30000)
        console.warn(`[Spotify API] Retry-After inválido (${retryAfter}), usando exponential backoff: ${waitTime / 1000}s`)
      }
    } else {
      // Si no hay Retry-After, usar exponential backoff
      waitTime = Math.min(baseDelay * Math.pow(2, retryCount), 30000) // Máximo 30 segundos
    }
    
    // Limitar máximo a 5 minutos para evitar esperas muy largas que superen el timeout de la API route
    const MAX_WAIT_TIME = 5 * 60 * 1000 // 5 minutos en milisegundos
    if (waitTime > MAX_WAIT_TIME) {
      console.warn(`[Spotify API] Tiempo de espera muy largo (${waitTime / 1000}s), limitando a 5 minutos`)
      waitTime = MAX_WAIT_TIME
    }
    
    // Si el tiempo de espera es muy largo (> 2 minutos), es mejor fallar rápido que esperar
    // porque probablemente el proceso completo va a timeout antes de completarse
    const MAX_REASONABLE_WAIT = 2 * 60 * 1000 // 2 minutos
    if (waitTime > MAX_REASONABLE_WAIT && retryCount === 0) {
      console.error(`[Spotify API] Rate limit muy alto (${(waitTime / 1000).toFixed(0)}s). Es mejor reintentar más tarde.`)
      throw new Error(`Rate limit muy alto. Spotify sugiere esperar ${(waitTime / 60000).toFixed(1)} minutos. Por favor intenta crear la playlist más tarde.`)
    }
    
    if (retryCount < maxRetries) {
      const waitTimeSeconds = (waitTime / 1000).toFixed(1)
      const waitTimeMinutes = (waitTime / 60000).toFixed(1)
      const waitTimeDisplay = waitTime > 60000 ? `${waitTimeMinutes}m` : `${waitTimeSeconds}s`
      
      console.log(`[Spotify API] Rate limit alcanzado. Esperando ${waitTimeDisplay} antes de reintentar... (intento ${retryCount + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return spotifyApiRequest(endpoint, accessToken, options, retryCount + 1)
    } else {
      throw new Error(`Rate limit excedido después de ${maxRetries} intentos. Spotify sugiere esperar ${waitTime > 60000 ? `${(waitTime / 60000).toFixed(1)} minutos` : `${(waitTime / 1000).toFixed(0)} segundos`}. Por favor intenta más tarde.`)
    }
  }

  if (response.status === 401) {
    // Token expirado, habría que refrescar aquí
    throw new Error("Token expirado")
  }

  return response
}

