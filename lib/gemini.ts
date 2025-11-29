/**
 * Funciones para interactuar con Gemini API
 */

import { getBPMForActivity, findMatchingActivities } from "./activity-matcher"

export interface GeminiPlaylistCriteria {
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
 * Llama a Gemini API para generar criterios de búsqueda de playlist
 */
export async function callGeminiAPI(
  userPrompt: string,
  userData: UserSpotifyData
): Promise<GeminiPlaylistCriteria> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY

  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY no está configurada")
  }

  // Intentar identificar actividad e intensidad del prompt
  let activityBPM: { min: number; max: number } | null = null
  let identifiedActivity: string | null = null
  
  // Buscar actividad en el prompt
  const activities = findMatchingActivities(userPrompt)
  if (activities.length > 0) {
    // Extraer intensidad del prompt si existe
    const intensityKeywords = {
      'chill': 'más chill',
      'más chill': 'más chill',
      'relajada': 'relajada',
      'suave': 'suave',
      'media': 'media',
      'moderada': 'moderada',
      'alta': 'alta',
      'fuerte': 'fuerte',
      'entrenamiento fuerte': 'entrenamiento fuerte',
      'intensa': 'intensa',
      'muy alta': 'muy alta',
    }
    
    let userIntensity: string | undefined
    const promptLower = userPrompt.toLowerCase()
    for (const [key, value] of Object.entries(intensityKeywords)) {
      if (promptLower.includes(key)) {
        userIntensity = value
        break
      }
    }
    
    // Intentar obtener BPM para la actividad
    const bpmData = getBPMForActivity(activities[0].actividad, userIntensity)
    if (bpmData) {
      activityBPM = { min: bpmData.min, max: bpmData.max }
      identifiedActivity = activities[0].actividad
    }
  }

  // Construir el prompt para Gemini
  const prompt = `Eres un experto en música y creación de playlists personalizadas. Analiza el siguiente prompt del usuario y genera criterios de búsqueda para crear una playlist perfecta.

PROMPT DEL USUARIO: "${userPrompt}"
${identifiedActivity ? `ACTIVIDAD IDENTIFICADA: ${identifiedActivity} (BPM recomendado: ${activityBPM?.min}-${activityBPM?.max})` : ''}

DATOS DEL USUARIO DE SPOTIFY:
- Géneros favoritos: ${userData.topGenres.join(", ") || "No especificados"}
- Artistas favoritos: ${userData.favoriteArtists.map(a => a.name).join(", ") || "No especificados"}
- Preferencias musicales:
  - Energía: ${userData.musicPreferences.energy}
  - Tempo: ${userData.musicPreferences.tempo}
  - Mood: ${userData.musicPreferences.mood}

INSTRUCCIONES:
1. Interpreta el prompt del usuario identificando: actividad, intensidad y tiempo
2. ${activityBPM ? `USA el rango de BPM ${activityBPM.min}-${activityBPM.max} para esta actividad. Las canciones deben tener un tempo (BPM) dentro de este rango.` : 'Identifica la actividad mencionada y ajusta el tempo según corresponda.'}
3. Combina el prompt con los gustos del usuario para crear una playlist personalizada
4. Si el prompt contradice las preferencias del usuario, adapta los criterios al contexto del prompt pero mantén cierta conexión con sus gustos si es posible
5. Genera un JSON válido con los siguientes campos:
   - playlistName: Nombre sugerido para la playlist (máximo 50 caracteres)
   - description: Descripción breve de la playlist (máximo 200 caracteres)
   - criteria: Objeto con:
     - genres: Array de géneros musicales (máximo 5)
     - energy: "high", "medium" o "low" (opcional)
     - tempo: "fast", "medium" o "slow" (opcional)
     - mood: "upbeat" o "mellow" (opcional)
     - artists: Array de nombres de artistas a incluir (opcional, máximo 3)
     - excludeGenres: Array de géneros a excluir (opcional)
     - maxTracks: Número máximo de tracks (entre 15 y 50, por defecto 30)
     - bpmRange: [minBPM, maxBPM] ${activityBPM ? `DEBE ser [${activityBPM.min}, ${activityBPM.max}]` : 'si es relevante (opcional)'}

IMPORTANTE: Responde SOLO con un JSON válido, sin texto adicional antes o después.

EJEMPLO DE RESPUESTA:
{
  "playlistName": "Study Focus",
  "description": "Música instrumental y calmada para concentrarse mientras estudias",
  "criteria": {
    "genres": ["ambient", "instrumental", "lo-fi", "classical"],
    "energy": "low",
    "tempo": "slow",
    "mood": "mellow",
    "excludeGenres": ["metal", "rap"],
    "maxTracks": 30,
    "bpmRange": [60, 90]
  }
}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error en Gemini API:", errorText)
      throw new Error(`Gemini API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    // Extraer el texto de la respuesta
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      ""

    if (!responseText) {
      throw new Error("No se recibió respuesta de Gemini")
    }

    // Intentar parsear el JSON de la respuesta
    // Gemini a veces envuelve el JSON en markdown, así que lo limpiamos
    let jsonText = responseText.trim()
    
    // Remover markdown code blocks si existen
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    jsonText = jsonText.trim()

    // Buscar el primer { y último } para extraer solo el JSON
    const firstBrace = jsonText.indexOf("{")
    const lastBrace = jsonText.lastIndexOf("}")

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1)
    }

    const criteria = JSON.parse(jsonText) as GeminiPlaylistCriteria

    // Validar que tenga los campos mínimos
    if (!criteria.playlistName || !criteria.criteria) {
      throw new Error("Respuesta de Gemini no tiene el formato esperado")
    }

    // Establecer valores por defecto
    if (!criteria.description) {
      criteria.description = `Playlist personalizada: ${criteria.playlistName}`
    }

    if (!criteria.criteria.maxTracks) {
      criteria.criteria.maxTracks = 30
    }

    // Si identificamos una actividad con BPM, asegurar que se use
    if (activityBPM && !criteria.criteria.bpmRange) {
      criteria.criteria.bpmRange = [activityBPM.min, activityBPM.max]
    }

    return criteria
  } catch (error) {
    console.error("Error llamando a Gemini:", error)
    
    // Si falla, devolver criterios por defecto basados en el prompt
    const fallbackCriteria: GeminiPlaylistCriteria = {
      playlistName: userPrompt.length > 50 ? userPrompt.substring(0, 50) : userPrompt,
      description: `Playlist: ${userPrompt}`,
      criteria: {
        genres: userData.topGenres.slice(0, 3),
        energy: userData.musicPreferences.energy,
        tempo: userData.musicPreferences.tempo,
        mood: userData.musicPreferences.mood,
        maxTracks: 30,
      },
    }

    return fallbackCriteria
  }
}

