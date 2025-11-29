/**
 * Función para que OpenAI seleccione canciones específicas del label Dale Play Records
 * Devuelve una lista de canciones específicas (track name + artist name) para buscar en Spotify
 */

import { getBPMForActivity, findMatchingActivities } from "./activity-matcher"
import { extractDurationAndCalculateTracks } from "./openai"

export interface SelectedTrack {
  trackName: string
  artistName: string
  reason?: string // Por qué se seleccionó esta canción
}

export interface TrackSelectionResult {
  playlistName: string
  description: string
  tracks: SelectedTrack[]
}

export interface LabelData {
  artists: Array<{ name: string; genres: string[] }> // Puede estar vacío - solo para contexto adicional si está disponible
  genres: string[] // Puede estar vacío - solo para contexto adicional si está disponible
}

/**
 * Llama a OpenAI para que seleccione canciones específicas del label Dale Play Records
 */
export async function selectTracksWithOpenAI(
  userPrompt: string,
  labelData: LabelData,
  maxTracks: number
): Promise<TrackSelectionResult> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no está configurada")
  }

  // Detectar actividad y BPM si aplica
  let activityBPM: { min: number; max: number } | null = null
  let identifiedActivity: string | null = null
  
  const activities = findMatchingActivities(userPrompt)
  if (activities.length > 0) {
    identifiedActivity = activities[0]
    const bpmRange = getBPMForActivity(identifiedActivity)
    if (bpmRange) {
      activityBPM = bpmRange
    }
  }

  const functionDefinition = {
    name: "selectPlaylistTracks",
    description: "Selecciona canciones específicas del label Dale Play Records para crear una playlist personalizada. DEBES seleccionar canciones reales que existan en el catálogo de Dale Play Records.",
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
                description: "Nombre EXACTO del artista tal como aparece en Spotify (debe ser uno de los artistas disponibles del label)"
              },
              reason: {
                type: "string",
                description: "Breve explicación de por qué se seleccionó esta canción"
              }
            },
            required: ["trackName", "artistName"]
          },
          description: `Array de canciones específicas. DEBE tener exactamente ${maxTracks} canciones. Todas las canciones DEBEN ser del label Dale Play Records.`,
          minItems: maxTracks,
          maxItems: maxTracks
        }
      },
      required: ["playlistName", "description", "tracks"]
    }
  }

  // Construir información del label (si está disponible, sino solo el nombre)
  const labelInfo = labelData.artists.length > 0 
    ? `ARTISTAS DISPONIBLES EN DALE PLAY RECORDS:
${labelData.artists.map(a => `- ${a.name}${a.genres.length > 0 ? ` (géneros: ${a.genres.join(", ")})` : ''}`).join("\n")}

GÉNEROS DISPONIBLES EN EL LABEL:
${labelData.genres.length > 0 ? labelData.genres.join(", ") : "Variados"}`
    : `El label "Dale Play Records" es un sello discográfico. Selecciona canciones que estén publicadas bajo este label.`

  const systemMessage = `Eres un experto en música y creación de playlists personalizadas para el label "Dale Play Records".

INSTRUCCIONES CRÍTICAS:
1. Debes seleccionar ${maxTracks} canciones ESPECÍFICAS del label Dale Play Records
2. Las canciones DEBEN existir realmente en el catálogo de Dale Play Records en Spotify
3. Los nombres de las canciones y artistas DEBEN ser EXACTOS (como aparecen en Spotify)
4. ${labelData.artists.length > 0 ? 'Todos los artistas DEBEN estar en la lista de artistas disponibles del label (ver abajo).' : 'Las canciones deben ser de artistas que pertenezcan al label Dale Play Records.'}
5. ${activityBPM ? `⚠️ ACTIVIDAD IDENTIFICADA: "${identifiedActivity}" con BPM recomendado: ${activityBPM.min}-${activityBPM.max}. Prioriza canciones que tengan este rango de BPM.` : ''}
6. Selecciona canciones que cumplan con el prompt del usuario
7. Varía los artistas (no más de 2-3 canciones del mismo artista)
8. El orden de las canciones debe ser lógico para la playlist

${labelInfo}

IMPORTANTE: Si no estás seguro de que una canción exista exactamente con ese nombre, NO la incluyas. Solo selecciona canciones que estés seguro que existen en el label Dale Play Records.`

  const userMessage = `PROMPT DEL USUARIO: "${userPrompt}"

${activityBPM ? `⚠️ ACTIVIDAD: "${identifiedActivity}" - Prioriza canciones con BPM entre ${activityBPM.min} y ${activityBPM.max}.` : ''}

Selecciona exactamente ${maxTracks} canciones específicas del label Dale Play Records que mejor cumplan con este prompt. Usa la función selectPlaylistTracks.`

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

    const result = JSON.parse(functionCall.arguments) as TrackSelectionResult

    if (!result.playlistName || !result.tracks || result.tracks.length !== maxTracks) {
      throw new Error(`OpenAI devolvió ${result.tracks?.length || 0} canciones, se esperaban ${maxTracks}`)
    }

    // Validar que todos los tracks tengan trackName y artistName válidos (strings)
    const validTracks = result.tracks.filter((t: any) => {
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

    if (validTracks.length !== result.tracks.length) {
      console.warn(`[selectTracksWithOpenAI] OpenAI devolvió ${result.tracks.length} tracks, pero solo ${validTracks.length} son válidos`)
    }

    // Asegurar que los valores sean strings y estén limpios
    result.tracks = validTracks.map((t: any) => ({
      trackName: String(t.trackName).trim(),
      artistName: String(t.artistName).trim(),
      reason: t.reason ? String(t.reason).trim() : undefined
    }))

    if (result.tracks.length === 0) {
      throw new Error(`OpenAI no devolvió tracks válidos. Todos los tracks tenían datos inválidos.`)
    }

    console.log(`✅ OpenAI seleccionó ${result.tracks.length} canciones específicas para la playlist`)
    return result

  } catch (error) {
    console.error("Error llamando a OpenAI API para selección de tracks:", error)
    throw error
  }
}

