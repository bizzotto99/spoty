/**
 * Funciones para crear playlists en Spotify
 */

import { spotifyApiRequest } from "./spotify"

export interface CreatePlaylistOptions {
  name: string
  description: string
  tracks: Array<{ uri: string }>
  isPublic?: boolean
}

/**
 * Crea una playlist en Spotify del usuario
 */
export async function createPlaylistInSpotify(
  accessToken: string,
  userId: string,
  options: CreatePlaylistOptions
): Promise<{ id: string; url: string }> {
  try {
    // 1. Crear la playlist
    const createRes = await spotifyApiRequest(
      `/users/${userId}/playlists`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({
          name: options.name,
          description: options.description || "",
          public: options.isPublic !== undefined ? options.isPublic : true,
        }),
      }
    )

    if (!createRes.ok) {
      const errorText = await createRes.text()
      throw new Error(`Error creando playlist: ${createRes.status} ${errorText}`)
    }

    const playlist = await createRes.json()
    const playlistId = playlist.id

    if (!playlistId) {
      throw new Error("No se recibió ID de playlist")
    }

    // 2. Agregar tracks a la playlist (en lotes de 100, que es el límite de Spotify)
    const trackUris = options.tracks.map((t) => t.uri)
    const batchSize = 100

    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize)

      const addTracksRes = await spotifyApiRequest(
        `/playlists/${playlistId}/tracks`,
        accessToken,
        {
          method: "POST",
          body: JSON.stringify({
            uris: batch,
          }),
        }
      )

      if (!addTracksRes.ok) {
        const errorText = await addTracksRes.text()
        console.error(`Error agregando tracks al lote ${i / batchSize + 1}:`, errorText)
        // Continuar con el siguiente lote aunque falle uno
      }
    }

    // 3. Construir URL de la playlist
    const playlistUrl = playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}`

    return {
      id: playlistId,
      url: playlistUrl,
    }
  } catch (error) {
    console.error("Error creando playlist:", error)
    throw error
  }
}

