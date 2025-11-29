/**
 * Funciones para interactuar con OpenAI API usando Function Calling
 */

import { getBPMForActivity, findMatchingActivities } from "./activity-matcher"

export interface PlaylistCriteria {
  playlistName: string
  description: string
  criteria: {
    genres: string[]
    energy?: "high" | "medium" | "low"
    tempo?: "fast" | "medium" | "slow"
    mood?: "upbeat" | "mellow"
    artists?: string[]
    excludeGenres?: string[]
    maxTracks?: number
    bpmRange?: [number, number]
  }
}

// Mantener compatibilidad con el nombre anterior (deprecated, usar PlaylistCriteria)
export type GeminiPlaylistCriteria = PlaylistCriteria

export interface UserSpotifyData {
  topGenres: string[]
  favoriteArtists: Array<{ name: string; genres: string[] }>
  musicPreferences: {
    energy: "high" | "medium" | "low"
    tempo: "fast" | "medium" | "slow"
    mood: "upbeat" | "mellow"
  }
}

/**
 * Extrae el tiempo del prompt y calcula la cantidad de canciones
 */
export function extractDurationAndCalculateTracks(userPrompt: string): number {
  const timePatterns = [
    { 
      regex: /(\d+)\s*(?:hora|horas|hr|hrs|h)\s*(?:y|,|\s)?\s*(\d+)\s*(?:minuto|minutos|min|mins)/i, 
      multiplier: 60,
      hasMinutes: true
    },
    { 
      regex: /(\d+)\s*(?:hora|horas|hr|hrs|h)(?!\s*(?:y|,|\d|minuto|minutos|min|mins))/i, 
      multiplier: 60,
      hasMinutes: false
    },
    { 
      regex: /aprox(?:imadamente)?\s*(\d+)\s*(?:minuto|minutos|min|mins)/i, 
      multiplier: 1,
      hasMinutes: false
    },
    { 
      regex: /(\d+)\s*(?:minuto|minutos|min|mins)/i, 
      multiplier: 1,
      hasMinutes: false,
      checkNoAprox: true
    },
  ]

  let totalMinutes: number | null = null
  const promptLower = userPrompt.toLowerCase()
  
  for (const pattern of timePatterns) {
    const match = promptLower.match(pattern.regex)
    if (match) {
      if (pattern.checkNoAprox) {
        const matchIndex = promptLower.indexOf(match[0])
        const beforeMatch = promptLower.substring(Math.max(0, matchIndex - 20), matchIndex)
        if (beforeMatch.includes('aprox')) {
          continue
        }
      }
      
      const hours = parseInt(match[1] || '0', 10)
      const minutes = pattern.hasMinutes ? parseInt(match[2] || '0', 10) : 0
      totalMinutes = hours * pattern.multiplier + minutes
      break
    }
  }

  const DEFAULT_DURATION_MINUTES = 20
  const actualMinutes = totalMinutes || DEFAULT_DURATION_MINUTES
  
  const avgSongDurationMinutes = 3.5
  const calculatedMaxTracks = Math.ceil(actualMinutes / avgSongDurationMinutes)
  return Math.max(10, Math.min(20, calculatedMaxTracks)) // Límite máximo de 20 canciones
}

/**
 * Llama a OpenAI API para generar criterios de búsqueda de playlist usando Function Calling
 */
export async function callOpenAIAPI(
  userPrompt: string,
  userData: UserSpotifyData
): Promise<PlaylistCriteria> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no está configurada")
  }

  // Intentar identificar actividad e intensidad del prompt
  let activityBPM: { min: number; max: number } | null = null
  let identifiedActivity: string | null = null
  
  const activities = findMatchingActivities(userPrompt)
  if (activities.length > 0) {
    const intensityKeywords = {
      'muy alta': 'muy alta',
      'entrenamiento fuerte': 'entrenamiento fuerte',
      'más chill': 'más chill',
      'chill': 'más chill',
      'relajada': 'relajada',
      'suave': 'suave',
      'media': 'media',
      'moderada': 'moderada',
      'alta': 'alta',
      'fuerte': 'fuerte',
      'intensa': 'intensa',
    }
    
    let userIntensity: string | undefined
    const promptLower = (userPrompt && typeof userPrompt === 'string' ? userPrompt : '').toLowerCase()
    
    for (const [key, value] of Object.entries(intensityKeywords)) {
      if (promptLower.includes(key)) {
        userIntensity = value
        break
      }
    }
    
    let selectedActivity = activities[0]
    if (activities.length > 1 && userIntensity) {
      const intensityMap: Record<string, string[]> = {
        'más chill': ['Baja', 'Muy baja'],
        'relajada': ['Baja', 'Muy baja'],
        'suave': ['Baja', 'Baja-Moderada'],
        'media': ['Moderada'],
        'moderada': ['Moderada'],
        'alta': ['Alta', 'Moderada-Alta'],
        'fuerte': ['Alta', 'Muy alta'],
        'entrenamiento fuerte': ['Alta', 'Muy alta'],
        'intensa': ['Alta', 'Muy alta'],
        'muy alta': ['Muy alta'],
      }
      
      const targetIntensities = intensityMap[userIntensity] || []
      if (targetIntensities.length > 0) {
        const matchingActivity = activities.find(act => 
          targetIntensities.includes(act.intensidad)
        )
        if (matchingActivity) {
          selectedActivity = matchingActivity
        }
      }
    }
    
    const bpmData = getBPMForActivity(selectedActivity.actividad, userIntensity)
    if (bpmData) {
      activityBPM = { min: bpmData.min, max: bpmData.max }
      identifiedActivity = selectedActivity.actividad
    }
  }

  // Calcular cantidad de tracks basado en duración
  const finalMaxTracks = extractDurationAndCalculateTracks(userPrompt)

  // Definir la función que OpenAI puede "llamar" usando Function Calling
  const functionDefinition = {
    name: "generatePlaylistCriteria",
    description: "Genera criterios estructurados para crear una playlist personalizada basada en el prompt del usuario, sus preferencias musicales y datos del label Dale Play Records",
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
        criteria: {
          type: "object",
          properties: {
            genres: {
              type: "array",
              items: { type: "string" },
              description: "Array de géneros musicales (máximo 5)",
              maxItems: 5
            },
            energy: {
              type: "string",
              enum: ["high", "medium", "low"],
              description: "Nivel de energía de la música"
            },
            tempo: {
              type: "string",
              enum: ["fast", "medium", "slow"],
              description: "Tempo/velocidad de la música"
            },
            mood: {
              type: "string",
              enum: ["upbeat", "mellow"],
              description: "Estado de ánimo de la música"
            },
            artists: {
              type: "array",
              items: { type: "string" },
              description: "Array de nombres de artistas a incluir (máximo 3, opcional)",
              maxItems: 3
            },
            excludeGenres: {
              type: "array",
              items: { type: "string" },
              description: "Array de géneros a excluir (opcional)"
            },
            maxTracks: {
              type: "number",
              description: `Número máximo de tracks. DEBE ser ${finalMaxTracks} para cumplir con la duración solicitada o por defecto (20 minutos)`
            },
            bpmRange: {
              type: "array",
              items: { type: "number" },
              minItems: 2,
              maxItems: 2,
              description: activityBPM 
                ? `⚠️ OBLIGATORIO: Array con [minBPM, maxBPM]. DEBE ser exactamente [${activityBPM.min}, ${activityBPM.max}] para la actividad "${identifiedActivity}". El BPM se filtrará estrictamente en el backend.`
                : "Rango de BPM (Beats Per Minute) si es relevante (opcional). Ejemplos: [60, 80] (muy lento, relajación), [120, 140] (moderado, caminar), [150, 180] (rápido, correr)"
            }
          },
          required: ["genres", "maxTracks"]
        }
      },
      required: ["playlistName", "description", "criteria"]
    }
  }

  // Construir el mensaje del sistema y del usuario
  const systemMessage = `Eres un experto en música y creación de playlists personalizadas. Analiza el prompt del usuario y genera criterios de búsqueda estructurados para crear una playlist perfecta.

${identifiedActivity ? `⚠️ ACTIVIDAD IDENTIFICADA: "${identifiedActivity}" con BPM recomendado: ${activityBPM?.min}-${activityBPM?.max}. DEBES usar EXACTAMENTE este rango de BPM en el bpmRange.` : ''}

INSTRUCCIONES CRÍTICAS:
1. Interpreta el prompt del usuario identificando: actividad, intensidad y tiempo
2. ${activityBPM ? `⚠️ CRÍTICO: USA EXACTAMENTE el rango de BPM ${activityBPM.min}-${activityBPM.max} para esta actividad. TODAS las canciones DEBEN tener un tempo entre ${activityBPM.min} y ${activityBPM.max} BPM.` : 'Identifica la actividad mencionada y ajusta el tempo según corresponda.'}
3. Combina el prompt con los datos del label Dale Play Records para crear una playlist personalizada
4. El BPM es fundamental: cada actividad tiene un rango de BPM ideal. Respeta este rango estrictamente si está especificado.
5. maxTracks DEBE ser ${finalMaxTracks} para cumplir con la duración solicitada.
6. Selecciona géneros y artistas que estén disponibles en el label Dale Play Records.`

  const userMessage = `PROMPT DEL USUARIO: "${userPrompt}"

DATOS DEL LABEL DALE PLAY RECORDS:
- Géneros disponibles: ${userData.topGenres.join(", ") || "No especificados"}
- Artistas disponibles: ${userData.favoriteArtists.map(a => a.name).join(", ") || "No especificados"}
- Preferencias musicales del contexto:
  - Energía: ${userData.musicPreferences.energy}
  - Tempo: ${userData.musicPreferences.tempo}
  - Mood: ${userData.musicPreferences.mood}

Genera los criterios de búsqueda para esta playlist usando la función generatePlaylistCriteria.`

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo", // Usar gpt-4-turbo para mejor calidad (alternativa: gpt-3.5-turbo para más económico)
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        functions: [functionDefinition],
        function_call: { name: "generatePlaylistCriteria" }, // Forzar el uso de esta función
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

    // Extraer la respuesta de la función
    const functionCall = data.choices?.[0]?.message?.function_call
    
    if (!functionCall || functionCall.name !== "generatePlaylistCriteria") {
      throw new Error("OpenAI no devolvió la función esperada")
    }

    const criteria = JSON.parse(functionCall.arguments) as PlaylistCriteria

    // Validar que tenga los campos mínimos
    if (!criteria.playlistName || !criteria.criteria) {
      throw new Error("Respuesta de OpenAI no tiene el formato esperado")
    }

    // Establecer valores por defecto
    if (!criteria.description) {
      criteria.description = `Playlist personalizada: ${criteria.playlistName}`
    }

    // Forzar maxTracks calculado
    criteria.criteria.maxTracks = finalMaxTracks

    // Si identificamos una actividad con BPM, SIEMPRE forzar el bpmRange (CRUCIAL)
    if (activityBPM) {
      criteria.criteria.bpmRange = [activityBPM.min, activityBPM.max]
      console.log(`⚠️ BPM OBLIGATORIO para actividad "${identifiedActivity}": ${activityBPM.min}-${activityBPM.max} BPM`)
    }

    console.log(`✅ OpenAI generó criterios exitosamente: ${criteria.playlistName}`)
    return criteria

  } catch (error) {
    console.error("Error llamando a OpenAI API:", error)
    
    // Fallback: devolver criterios por defecto
    const DEFAULT_DURATION_MINUTES = 20
    const finalMaxTracks = extractDurationAndCalculateTracks(userPrompt)
    
    const fallbackCriteria: PlaylistCriteria = {
      playlistName: userPrompt.length > 50 ? userPrompt.substring(0, 50) : userPrompt,
      description: `Playlist: ${userPrompt}`,
      criteria: {
        genres: userData.topGenres.slice(0, 3),
        energy: userData.musicPreferences.energy,
        tempo: userData.musicPreferences.tempo,
        mood: userData.musicPreferences.mood,
        maxTracks: finalMaxTracks,
        ...(activityBPM ? { bpmRange: [activityBPM.min, activityBPM.max] } : {}),
      },
    }
    
    if (activityBPM) {
      console.log(`FALLBACK: BPM OBLIGATORIO para actividad: ${identifiedActivity} = ${activityBPM.min}-${activityBPM.max} BPM`)
    }

    return fallbackCriteria
  }
}


