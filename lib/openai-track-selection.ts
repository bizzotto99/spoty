/**
 * Función para que OpenAI seleccione canciones específicas del label Dale Play Records
 * OpenAI genera nombres de tracks y artistas, luego el código los busca en Spotify
 */

export interface SelectedTrack {
  trackName: string
  artistName: string
  reason?: string
}

export interface TrackSelectionResult {
  playlistName: string
  description: string
  tracks: SelectedTrack[]
}

/**
 * Llama a OpenAI para que seleccione canciones específicas del label Dale Play Records
 * OpenAI recibe SOLO el prompt y el nombre del label
 * Retorna: Lista de tracks (trackName + artistName) para buscar en Spotify
 */
export async function selectTracksWithOpenAI(
  userPrompt: string,
  labelName: string,
  maxTracks: number
): Promise<TrackSelectionResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no está configurada")
  }

  const functionDefinition = {
    name: "selectPlaylistTracks",
    description: `Selecciona canciones específicas del sello discográfico (record label) "${labelName}" para crear una playlist personalizada basada en el prompt del usuario.`,
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
                description: "Nombre EXACTO de la canción tal como aparece en Spotify"
              },
              artistName: {
                type: "string",
                description: `Nombre EXACTO del artista principal tal como aparece en Spotify (sin "feat.", "ft.", etc.)`
              },
              reason: {
                type: "string",
                description: "Breve explicación de por qué se seleccionó esta canción (opcional)"
              }
            },
            required: ["trackName", "artistName"]
          },
          description: `Array de canciones. DEBE tener EXACTAMENTE ${maxTracks} canciones. TODAS las canciones DEBEN ser del sello discográfico "${labelName}" (case-insensitive: "Dale Play Records", "DALE PLAY RECORDS", "dale play records" son válidos).`,
          minItems: maxTracks,
          maxItems: maxTracks
        }
      },
      required: ["playlistName", "description", "tracks"]
    }
  }

  const systemMessage = `Eres un experto en música del sello discográfico "${labelName}".

IMPORTANTE:
- "${labelName}" es un SELLO DISCOGRÁFICO (record label)
- Solo debes seleccionar canciones que EXISTEN y están publicadas bajo este sello
- El label puede aparecer con variaciones de mayúsculas/minúsculas pero el texto es siempre "${labelName}"

INSTRUCCIONES:
1. Selecciona EXACTAMENTE ${maxTracks} canciones del sello "${labelName}"
2. Los nombres deben ser EXACTOS como aparecen en Spotify
3. Para artistas, usa solo el nombre principal (sin "feat.", "ft.", "with", etc.)
4. Varía los artistas (máximo 2-3 canciones del mismo artista)
5. Respeta el mood, género y duración del prompt
6. El orden debe ser lógico para la experiencia de escucha

CRÍTICO:
- TODAS las canciones deben ser del sello "${labelName}"
- NO inventes canciones que no existan
- Solo selecciona canciones reales del catálogo de Spotify`

  const userMessage = `PROMPT DEL USUARIO: "${userPrompt}"

TAREA:
Selecciona EXACTAMENTE ${maxTracks} canciones del sello discográfico "${labelName}" que mejor se ajusten al prompt.

CONSIDERACIONES:
- Duración: ${maxTracks} canciones (cada canción ≈ 3-4 minutos)
- Si el prompt menciona artistas, géneros o mood, respétalos (pero solo si están en "${labelName}")
- Los nombres de tracks y artistas deben ser EXACTOS para que Spotify los encuentre
- TODAS las canciones deben ser del sello "${labelName}"

Usa la función selectPlaylistTracks para devolver las ${maxTracks} canciones.`

  try {
    console.log(`🤖 Llamando a OpenAI para seleccionar ${maxTracks} canciones del label "${labelName}"...`)
    
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

    if (!result.playlistName || !result.tracks || !Array.isArray(result.tracks)) {
      throw new Error("OpenAI no devolvió el formato esperado")
    }

    if (result.tracks.length !== maxTracks) {
      console.warn(`⚠️ OpenAI devolvió ${result.tracks.length} canciones, se esperaban ${maxTracks}`)
    }

    // Validar y limpiar tracks
    const validTracks = result.tracks
      .filter((t: any) => {
        const isValid = t && 
          t.trackName && 
          typeof t.trackName === 'string' && 
          t.trackName.trim().length > 0 &&
          t.artistName && 
          typeof t.artistName === 'string' && 
          t.artistName.trim().length > 0
        
        if (!isValid) {
          console.warn(`[selectTracksWithOpenAI] ⚠️ Track inválido recibido de OpenAI:`, t)
        }
        return isValid
      })
      .map((t: any) => ({
        trackName: String(t.trackName).trim(),
        artistName: String(t.artistName).trim(),
        reason: t.reason ? String(t.reason).trim() : undefined
      }))

    if (validTracks.length === 0) {
      throw new Error(`OpenAI no devolvió tracks válidos`)
    }

    console.log(`✅ OpenAI seleccionó ${validTracks.length} canciones para la playlist`)

    return {
      playlistName: result.playlistName,
      description: result.description || "Playlist generada con IA",
      tracks: validTracks
    }

  } catch (error) {
    console.error("Error llamando a OpenAI API para selección de tracks:", error)
    throw error
  }
}
