/**
 * Funciones para crear playlists en Spotify
 */

import { spotifyApiRequest } from "./spotify"
import fs from "fs"
import path from "path"

export interface CreatePlaylistOptions {
  name: string
  description: string
  tracks: Array<{ uri: string }>
  isPublic?: boolean
  imagePath?: string
  imageUrl?: string // URL de internet para la imagen
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

    // 3. Subir imagen de la playlist si se proporciona
    if (options.imageUrl || options.imagePath) {
      try {
        let imageBuffer: Buffer
        let contentType: string

        // Si hay una URL de internet, descargarla
        if (options.imageUrl) {
          console.log(`[create-playlist] Descargando imagen desde URL: ${options.imageUrl}`)
          const imageResponse = await fetch(options.imageUrl)
          
          if (!imageResponse.ok) {
            throw new Error(`Error descargando imagen: ${imageResponse.status} ${imageResponse.statusText}`)
          }

          imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
          
          // Determinar content type desde la respuesta o la URL
          const responseContentType = imageResponse.headers.get("content-type")
          if (responseContentType && (responseContentType.includes("image/png") || responseContentType.includes("image/jpeg"))) {
            contentType = responseContentType
          } else {
            // Fallback: determinar por extensión de la URL
            const urlPath = new URL(options.imageUrl).pathname
            const ext = path.extname(urlPath).toLowerCase()
            contentType = ext === ".png" ? "image/png" : "image/jpeg"
          }
        } else if (options.imagePath) {
          // Leer la imagen desde el sistema de archivos local
          const imagePath = path.join(process.cwd(), "public", options.imagePath)
          imageBuffer = fs.readFileSync(imagePath)
          
          // Determinar el tipo de imagen basado en la extensión
          const ext = path.extname(options.imagePath).toLowerCase()
          contentType = ext === ".png" ? "image/png" : "image/jpeg"
        } else {
          return { id: playlistId, url: playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlistId}` }
        }

        // Convertir a base64
        const imageBase64 = imageBuffer.toString("base64")

        // Verificar tamaño (Spotify acepta máximo 256KB)
        const sizeInKB = imageBuffer.length / 1024
        if (sizeInKB > 256) {
          console.warn(`[create-playlist] ⚠️ La imagen es muy grande (${sizeInKB.toFixed(2)}KB). Spotify acepta máximo 256KB. Intentando subir de todas formas...`)
        }

        console.log(`[create-playlist] Subiendo imagen a Spotify (${sizeInKB.toFixed(2)}KB, ${contentType})`)

        // Subir imagen a Spotify (acepta JPEG o PNG, máximo 256KB)
        const uploadImageRes = await spotifyApiRequest(
          `/playlists/${playlistId}/images`,
          accessToken,
          {
            method: "PUT",
            headers: {
              "Content-Type": contentType,
            },
            body: imageBase64,
          }
        )

        if (!uploadImageRes.ok) {
          const errorText = await uploadImageRes.text()
          console.error(`[create-playlist] ❌ Error subiendo imagen de playlist: ${uploadImageRes.status} ${errorText}`)
          // No fallar si la imagen no se puede subir, solo loguear el error
        } else {
          console.log("[create-playlist] ✅ Imagen de playlist subida exitosamente a Spotify")
        }
      } catch (error) {
        console.error("[create-playlist] ❌ Error procesando imagen de playlist:", error)
        // No fallar si la imagen no se puede subir, solo loguear el error
      }
    }

    // 4. Construir URL de la playlist
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

