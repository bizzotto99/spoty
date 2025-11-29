/**
 * Función para que OpenAI seleccione canciones del catálogo de Dale Play Records
 * OpenAI recibe una lista de tracks disponibles y selecciona los mejores según el prompt
 */

import type { Track } from "./search-daleplay"

export interface TrackSelectionResult {
  playlistName: string
  description: string
  selectedTrackIds: string[] // IDs de los tracks seleccionados
}

/**
 * Llama a OpenAI para que seleccione canciones de la lista disponible
 * OpenAI recibe: prompt del usuario + lista de tracks disponibles del label
 * Retorna: IDs de los tracks seleccionados
 */
export async function selectTracksFromCatalog(
  userPrompt: string,
  availableTracks: Track[],
  maxTracks: number
): Promise<TrackSelectionResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no está configurada")
  }

  // Preparar lista de tracks para OpenAI (solo info relevante)
  const tracksCatalog = availableTracks.map((track, index) => ({
    id: index, // Usamos el índice como ID para que OpenAI seleccione
    trackId: track.id, // ID real de Spotify
    name: track.name,
    artist: track.artist,
    album: track.album,
  }))

  const functionDefinition = {
    name: "selectPlaylistTracks",
    description: "Selecciona canciones del catálogo de Dale Play Records para crear una playlist personalizada basada en el prompt del usuario.",
    parameters: {
      type: "object",
      properties: {
        playlistName: {
          type: "string",
          description: "Nombre sugerido para la playlist (máximo 50 caracteres)"
        },
        description: {
          type: "string",
          description: "Descripción breve de la playlist (máximo 200 caracteres)"
        },
        selectedTrackIds: {
          type: "array",
          items: {
            type: "number",
            description: "ID numérico de la canción del catálogo"
          },
          description: `Array de IDs de canciones seleccionadas. DEBE tener EXACTAMENTE ${maxTracks} IDs. Selecciona las canciones que mejor se ajusten al prompt del usuario.`,
          minItems: maxTracks,
          maxItems: maxTracks
        }
      },
      required: ["playlistName", "description", "selectedTrackIds"]
    }
  }

  const systemMessage = `Eres un experto en música y creación de playlists personalizadas para el sello discográfico "Dale Play Records".

INSTRUCCIONES:
1. Tienes acceso a un catálogo de ${tracksCatalog.length} canciones del sello "Dale Play Records"
2. Debes seleccionar EXACTAMENTE ${maxTracks} canciones que mejor se ajusten al prompt del usuario
3. Considera el mood, género, artistas mencionados, y duración solicitada
4. Varía los artistas cuando sea posible (no más de 2-3 canciones del mismo artista seguidas)
5. El orden debe ser lógico para la experiencia de escucha
6. Retorna los IDs numéricos de las canciones seleccionadas (del campo "id" del catálogo)

IMPORTANTE:
- Solo puedes seleccionar canciones del catálogo proporcionado
- No inventes nombres de canciones o artistas
- Usa SOLO los IDs del catálogo`

  const userMessage = `PROMPT DEL USUARIO: "${userPrompt}"

CATÁLOGO DISPONIBLE (${tracksCatalog.length} canciones de Dale Play Records):
${JSON.stringify(tracksCatalog, null, 2)}

TAREA:
Selecciona EXACTAMENTE ${maxTracks} canciones del catálogo que mejor se ajusten al prompt.
- Si el prompt menciona duración, respétala (${maxTracks} canciones ≈ ${Math.round(maxTracks * 3.5)} minutos)
- Si menciona artistas, priorízalos (pero solo si están en el catálogo)
- Si menciona géneros o mood, selecciona canciones apropiadas
- Crea una playlist coherente y fluida

Usa la función selectPlaylistTracks para devolver los IDs de las ${maxTracks} canciones seleccionadas.`

  try {
    console.log(`🤖 OpenAI seleccionando ${maxTracks} canciones de ${tracksCatalog.length} disponibles...`)
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        functions: [functionDefinition],
        function_call: { name: "selectPlaylistTracks" },
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const functionCall = data.choices?.[0]?.message?.function_call

    if (!functionCall || functionCall.name !== "selectPlaylistTracks") {
      throw new Error("OpenAI no devolvió la función esperada")
    }

    const result = JSON.parse(functionCall.arguments)

    if (!result.playlistName || !result.selectedTrackIds || !Array.isArray(result.selectedTrackIds)) {
      throw new Error("OpenAI no devolvió el formato esperado")
    }

    if (result.selectedTrackIds.length !== maxTracks) {
      console.warn(`⚠️ OpenAI devolvió ${result.selectedTrackIds.length} canciones, se esperaban ${maxTracks}`)
    }

    // Convertir los índices a IDs reales de Spotify
    const realTrackIds = result.selectedTrackIds
      .filter((index: number) => index >= 0 && index < tracksCatalog.length)
      .map((index: number) => tracksCatalog[index].trackId)

    console.log(`✅ OpenAI seleccionó ${realTrackIds.length} canciones para la playlist`)

    return {
      playlistName: result.playlistName,
      description: result.description || "Playlist generada con IA",
      selectedTrackIds: realTrackIds
    }

  } catch (error) {
    console.error("Error llamando a OpenAI API para selección de tracks:", error)
    throw error
  }
}
