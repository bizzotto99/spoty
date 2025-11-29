/**
 * Utilidades para matching de actividades y obtención de BPM
 */

import activitiesData from './activities.json'

// Type assertion para TypeScript
const activities = activitiesData as Activity[]

export interface Activity {
  actividad: string
  intensidad: string
  bpm_min: number
  bpm_max: number
}

export interface BPMRange {
  min: number
  max: number
  intensidad: string
}

/**
 * Busca actividades que coincidan con el texto dado
 */
export function findMatchingActivities(searchText: string): Activity[] {
  if (!searchText || typeof searchText !== 'string') {
    return []
  }
  const normalized = searchText.toLowerCase().trim()
  
  // Palabras comunes a ignorar (artículos, preposiciones, etc.)
  const stopWords = new Set([
    'que', 'quiero', 'una', 'un', 'el', 'la', 'los', 'las', 'de', 'del', 'para', 'por', 'con', 'sin',
    'playlist', 'playlists', 'música', 'musica', 'canciones', 'cancion', 'track', 'tracks',
    'minutos', 'minuto', 'horas', 'hora', 'tiempo', 'duración', 'duracion', 'aprox', 'aproximadamente'
  ])
  
  // Extraer palabras clave del texto (palabras de 3+ caracteres, excluyendo stop words)
  const words = normalized
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.has(word))
  
  // Buscar actividades que coincidan
  return activities.filter(activity => {
    const activityName = activity.actividad.toLowerCase()
    
    // Si el nombre completo de la actividad está en el texto
    if (normalized.includes(activityName)) {
      return true
    }
    
    // Si alguna palabra clave está en el nombre de la actividad
    // Ej: "correr" en "Correr normal" o "Correr rápido"
    for (const word of words) {
      if (activityName.includes(word)) {
        return true
      }
    }
    
    // También verificar si palabras del nombre de la actividad están en el texto
    const activityWords = activityName.split(/\s+/).filter(word => word.length >= 3)
    for (const activityWord of activityWords) {
      if (normalized.includes(activityWord)) {
        return true
      }
    }
    
    return false
  })
}

/**
 * Obtiene el rango de BPM para una actividad e intensidad específica
 */
export function getBPMForActivity(
  activityName: string,
  userIntensity?: string
): BPMRange | null {
  const normalizedActivity = activityName.toLowerCase().trim()
  
  // Buscar la actividad
  let matches = activities.filter(activity => {
    const activityNameLower = activity.actividad.toLowerCase()
    return activityNameLower.includes(normalizedActivity) || 
           normalizedActivity.includes(activityNameLower)
  })
  
  if (matches.length === 0) {
    return null
  }
  
  // Si hay intensidad del usuario, ajustar
  if (userIntensity && typeof userIntensity === 'string') {
    const normalizedIntensity = userIntensity.toLowerCase()
    
    // Mapeo de intensidades del usuario a intensidades del sistema
    const intensityMap: Record<string, string[]> = {
      'chill': ['Baja', 'Muy baja'],
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
    
    // Buscar intensidad que coincida
    const targetIntensities = intensityMap[normalizedIntensity] || []
    
    if (targetIntensities.length > 0) {
      matches = matches.filter(activity => 
        targetIntensities.includes(activity.intensidad)
      )
    }
  }
  
  // Si hay múltiples matches, tomar el promedio o el más común
  if (matches.length > 0) {
    const selected = matches[0] // Por ahora tomar el primero
    return {
      min: selected.bpm_min,
      max: selected.bpm_max,
      intensidad: selected.intensidad,
    }
  }
  
  return null
}

/**
 * Obtiene todas las actividades disponibles (para sugerencias)
 */
export function getAllActivities(): Activity[] {
  return activities
}

/**
 * Obtiene actividades por intensidad
 */
export function getActivitiesByIntensity(intensidad: string): Activity[] {
  return activities.filter(activity => activity.intensidad === intensidad)
}

