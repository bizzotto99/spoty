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
    // Extraer intensidad del prompt si existe (buscar todas las coincidencias, no solo la primera)
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
    const promptLower = userPrompt.toLowerCase()
    // Buscar en orden de especificidad (más específico primero)
    for (const [key, value] of Object.entries(intensityKeywords)) {
      if (promptLower.includes(key)) {
        userIntensity = value
        break
      }
    }
    
    // Si hay múltiples actividades, intentar elegir la mejor según la intensidad
    let selectedActivity = activities[0]
    if (activities.length > 1 && userIntensity) {
      // Si hay intensidad, buscar la actividad que mejor coincida
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
    
    // Intentar obtener BPM para la actividad seleccionada
    const bpmData = getBPMForActivity(selectedActivity.actividad, userIntensity)
    if (bpmData) {
      activityBPM = { min: bpmData.min, max: bpmData.max }
      identifiedActivity = selectedActivity.actividad
    }
  }

  // Extraer tiempo del prompt y calcular cantidad de canciones
  // Buscar patrones como "45 minutos", "1 hora", "30 min", "2 horas", etc.
  const timePatterns = [
    // Patrón para "1 hora y 30 minutos" o "1h 30min" o "1 hora, 30 minutos" o "1h30min"
    { 
      regex: /(\d+)\s*(?:hora|horas|hr|hrs|h)\s*(?:y|,|\s)?\s*(\d+)\s*(?:minuto|minutos|min|mins)/i, 
      multiplier: 60,
      hasMinutes: true
    },
    // Patrón para solo horas: "1 hora", "2 horas", "1h" (sin minutos después)
    { 
      regex: /(\d+)\s*(?:hora|horas|hr|hrs|h)(?!\s*(?:y|,|\d|minuto|minutos|min|mins))/i, 
      multiplier: 60,
      hasMinutes: false
    },
    // Patrón para "aprox 45 minutos" o "aproximadamente 30 minutos"
    { 
      regex: /aprox(?:imadamente)?\s*(\d+)\s*(?:minuto|minutos|min|mins)/i, 
      multiplier: 1,
      hasMinutes: false
    },
    // Patrón para "45 minutos" o "30 min" (verificar que no tenga "aprox" antes)
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
      // Si el patrón requiere verificar que no tenga "aprox" antes
      if (pattern.checkNoAprox) {
        const matchIndex = promptLower.indexOf(match[0])
        const beforeMatch = promptLower.substring(Math.max(0, matchIndex - 20), matchIndex)
        if (beforeMatch.includes('aprox')) {
          continue // Saltar este match, ya fue capturado por el patrón de "aprox"
        }
      }
      
      const hours = parseInt(match[1] || '0', 10)
      const minutes = pattern.hasMinutes ? parseInt(match[2] || '0', 10) : 0
      totalMinutes = hours * pattern.multiplier + minutes
      break
    }
  }

  // Calcular cantidad de canciones basado en el tiempo
  // Por defecto: 20 minutos si no se especifica duración
  const DEFAULT_DURATION_MINUTES = 20
  const actualMinutes = totalMinutes || DEFAULT_DURATION_MINUTES
  
  // Asumimos ~3.5 minutos por canción en promedio
  const avgSongDurationMinutes = 3.5
  const calculatedMaxTracks = Math.ceil(actualMinutes / avgSongDurationMinutes)
  // Limitar entre 10 y 100 canciones
  const finalMaxTracks = Math.max(10, Math.min(100, calculatedMaxTracks))

  // Construir el prompt para Gemini
  const prompt = `Eres un experto en música y creación de playlists personalizadas. Analiza el siguiente prompt del usuario y genera criterios de búsqueda para crear una playlist perfecta.

PROMPT DEL USUARIO: "${userPrompt}"
${identifiedActivity ? `ACTIVIDAD IDENTIFICADA: ${identifiedActivity} (BPM recomendado: ${activityBPM?.min}-${activityBPM?.max})` : ''}
${totalMinutes ? `DURACIÓN SOLICITADA POR EL USUARIO: ${totalMinutes} minutos (${finalMaxTracks} canciones aproximadamente)` : `DURACIÓN POR DEFECTO: ${DEFAULT_DURATION_MINUTES} minutos (${finalMaxTracks} canciones aproximadamente)`}

DATOS DEL USUARIO DE SPOTIFY:
- Géneros favoritos: ${userData.topGenres.join(", ") || "No especificados"}
- Artistas favoritos: ${userData.favoriteArtists.map(a => a.name).join(", ") || "No especificados"}
- Preferencias musicales:
  - Energía: ${userData.musicPreferences.energy}
  - Tempo: ${userData.musicPreferences.tempo}
  - Mood: ${userData.musicPreferences.mood}

INSTRUCCIONES:
1. Interpreta el prompt del usuario identificando: actividad, intensidad y tiempo
2. ${activityBPM ? `⚠️ CRÍTICO: USA EXACTAMENTE el rango de BPM ${activityBPM.min}-${activityBPM.max} para esta actividad. El BPM (Beats Per Minute) es el tempo de la canción. TODAS las canciones seleccionadas DEBEN tener un tempo entre ${activityBPM.min} y ${activityBPM.max} BPM. Esto es obligatorio y no negociable.` : 'Identifica la actividad mencionada y ajusta el tempo según corresponda. Si hay una actividad específica (ej: correr, dormir, estudiar), calcula el rango de BPM apropiado.'}
3. Combina el prompt con los gustos del usuario para crear una playlist personalizada
4. Si el prompt contradice las preferencias del usuario, adapta los criterios al contexto del prompt pero mantén cierta conexión con sus gustos si es posible
5. El BPM es fundamental: cada actividad tiene un rango de BPM ideal. Respeta este rango estrictamente.
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
     - maxTracks: Número máximo de tracks. ${totalMinutes ? `DEBE ser ${finalMaxTracks} para cumplir con la duración de ${totalMinutes} minutos solicitada por el usuario.` : `DEBE ser ${finalMaxTracks} para cumplir con la duración por defecto de ${DEFAULT_DURATION_MINUTES} minutos.`}
     - bpmRange: [minBPM, maxBPM] ${activityBPM ? `⚠️ OBLIGATORIO: DEBE ser exactamente [${activityBPM.min}, ${activityBPM.max}]. NO uses otro rango. El BPM se filtrará estrictamente en el backend, así que respeta este rango.` : 'si es relevante (opcional). El BPM representa los beats por minuto del tempo de la canción. Ejemplos: 60-80 BPM (muy lento, relajación), 120-140 BPM (moderado, caminar), 150-180 BPM (rápido, correr), 80-100 BPM (lento, meditación)'}

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

  // Lista de modelos a intentar en orden de preferencia
  const models = [
    { name: "gemini-2.0-flash-exp", version: "v1beta" },
    { name: "gemini-2.0-flash", version: "v1beta" },
    { name: "gemini-1.5-flash-8b", version: "v1beta" },
    { name: "gemini-1.5-flash", version: "v1beta" },
    { name: "gemini-1.5-pro", version: "v1beta" },
    { name: "gemini-pro", version: "v1" },
    { name: "gemini-1.0-pro", version: "v1beta" },
  ]

  let lastError: Error | null = null

  for (const model of models) {
    try {
      const apiVersion = model.version
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${apiVersion}/models/${model.name}:generateContent?key=${GEMINI_API_KEY}`,
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
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        // Si es 404, intentar con el siguiente modelo
        if (response.status === 404) {
          console.log(`Modelo ${model.name} no disponible (404), intentando siguiente modelo...`)
          lastError = new Error(`Modelo ${model.name} no encontrado`)
          continue
        }
        
        // Para otros errores, registrar y continuar
        console.error(`Error en Gemini API con modelo ${model.name}:`, errorData)
        lastError = new Error(`Gemini API error: ${response.status} ${JSON.stringify(errorData)}`)
        continue
      }

        // Si llegamos aquí, la respuesta fue exitosa
      const data = await response.json()
      console.log(`✅ Modelo ${model.name} funcionó correctamente`)

      // Extraer el texto de la respuesta
      const responseText =
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

      // Usar el maxTracks calculado basado en el tiempo (20 min por defecto o el especificado)
      criteria.criteria.maxTracks = finalMaxTracks

      // Si identificamos una actividad con BPM, SIEMPRE forzar el bpmRange (CRUCIAL)
      // Esto es OBLIGATORIO - no es opcional
      if (activityBPM) {
        criteria.criteria.bpmRange = [activityBPM.min, activityBPM.max]
        console.log(`⚠️ BPM OBLIGATORIO para actividad "${identifiedActivity}": ${activityBPM.min}-${activityBPM.max} BPM`)
      } else if (criteria.criteria.bpmRange) {
        // Si Gemini sugirió un bpmRange pero no hay actividad, mantenerlo
        console.log(`BPM sugerido por Gemini: ${criteria.criteria.bpmRange[0]}-${criteria.criteria.bpmRange[1]} BPM`)
      }

      // Éxito: retornar los criterios
      return criteria
    } catch (error) {
      // Si hay un error con este modelo, intentar el siguiente
      console.log(`Error con modelo ${model.name}, intentando siguiente modelo...`)
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
  }

  // Si llegamos aquí, ningún modelo funcionó
  console.error("Todos los modelos de Gemini fallaron:", lastError)
  
  // Si falla, devolver criterios por defecto basados en el prompt
  // SIEMPRE incluir BPM si hay actividad identificada (CRUCIAL)
  const fallbackCriteria: GeminiPlaylistCriteria = {
    playlistName: userPrompt.length > 50 ? userPrompt.substring(0, 50) : userPrompt,
    description: `Playlist: ${userPrompt}`,
    criteria: {
      genres: userData.topGenres.slice(0, 3),
      energy: userData.musicPreferences.energy,
      tempo: userData.musicPreferences.tempo,
      mood: userData.musicPreferences.mood,
      maxTracks: finalMaxTracks,
      // BPM es OBLIGATORIO si hay actividad
      ...(activityBPM ? { bpmRange: [activityBPM.min, activityBPM.max] } : {}),
    },
  }
  
  if (activityBPM) {
    console.log(`FALLBACK: BPM OBLIGATORIO para actividad: ${identifiedActivity} = ${activityBPM.min}-${activityBPM.max} BPM`)
  }

  return fallbackCriteria
}

