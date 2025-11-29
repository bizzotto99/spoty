/**
 * Función para que OpenAI seleccione directamente los tracks de la playlist
 */

export interface SelectedTrack {
  trackName: string
  artistName: string
  reason?: string // Por qué esta canción fue seleccionada
}

export interface TrackSelectionResult {
  playlistName: string
  description: string
  tracks: SelectedTrack[]
}

/**
 * Llama a OpenAI para que seleccione directamente los tracks de la playlist
 */
export async function selectTracksWithOpenAI(
  userPrompt: string,
  availableArtists: Array<{ name: string; genres: string[] }>,
  availableGenres: string[],
  maxTracks: number
): Promise<TrackSelectionResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no está configurada")
  }

  // Definir la función que OpenAI puede "llamar" para seleccionar tracks
  const functionDefinition = {
    name: "selectPlaylistTracks",
    description: `Selecciona exactamente ${maxTracks} canciones específicas del label Dale Play Records para crear la playlist basada en el prompt del usuario. DEBES seleccionar canciones reales que existan en el catálogo de Dale Play Records.`,
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
        tracks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              trackName: {
                type: "string",
                description: "Nombre exacto de la canción"
              },
              artistName: {
                type: "string",
                description: "Nombre exacto del artista (DEBE ser uno de los artistas disponibles del label)"
              },
              reason: {
                type: "string",
                description: "Breve explicación de por qué esta canción fue seleccionada"
              }
            },
            required: ["trackName", "artistName"]
          },
          description: `Array de exactamente ${maxTracks} canciones seleccionadas. DEBE tener exactamente ${maxTracks} canciones.`
        }
      },
      required: ["playlistName", "description", "tracks"]
    }
  }

  const systemMessage = `Eres un experto curatorial de música del label Dale Play Records. Tu tarea es seleccionar exactamente ${maxTracks} canciones específicas del catálogo de Dale Play Records para crear una playlist perfecta basada en el prompt del usuario.

REGLAS CRÍTICAS:
1. DEBES seleccionar EXACTAMENTE ${maxTracks} canciones
2. Todos los artistas DEBEN ser del label Dale Play Records (usa solo los artistas disponibles)
3. Selecciona canciones reales que probablemente existan en el catálogo
4. Varía los artistas para tener diversidad
5. Considera el mood, energía y tempo solicitado en el prompt
6. Las canciones deben tener sentido juntas como una playlist coherente`

  const userMessage = `PROMPT DEL USUARIO: "${userPrompt}"

ARTISTAS DISPONIBLES EN DALE PLAY RECORDS:
${availableArtists.map((a, i) => `${i + 1}. ${a.name} (géneros: ${a.genres.join(", ") || "N/A"})`).join("\n")}

GÉNEROS DISPONIBLES: ${availableGenres.join(", ") || "N/A"}

INSTRUCCIONES:
- Selecciona EXACTAMENTE ${maxTracks} canciones del catálogo de Dale Play Records
- Usa solo artistas de la lista de artistas disponibles
- Selecciona canciones que encajen con el prompt del usuario
- Varía entre diferentes artistas para tener diversidad
- Considera el flujo y coherencia de la playlist

Usa la función selectPlaylistTracks para seleccionar las ${maxTracks} canciones.`

  try {
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
        temperature: 0.8, // Un poco más alto para más creatividad en selección
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

    // Extraer la respuesta de la función
    const functionCall = data.choices?.[0]?.message?.function_call
    
    if (!functionCall || functionCall.name !== "selectPlaylistTracks") {
      throw new Error("OpenAI no devolvió la función esperada")
    }

    const result = JSON.parse(functionCall.arguments) as TrackSelectionResult

    // Validar que tenga las canciones esperadas
    if (!result.playlistName || !result.tracks || !Array.isArray(result.tracks)) {
      throw new Error("OpenAI no devolvió el formato esperado")
    }

    // Asegurar que tengamos exactamente maxTracks canciones
    if (result.tracks.length > maxTracks) {
      result.tracks = result.tracks.slice(0, maxTracks)
    }

    console.log(`✅ OpenAI seleccionó ${result.tracks.length} tracks directamente: ${result.playlistName}`)
    return result

  } catch (error) {
    console.error("Error llamando a OpenAI para seleccionar tracks:", error)
    throw error
  }
}

