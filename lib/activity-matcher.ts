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
  const normalized = searchText.toLowerCase().trim()
  
  // Buscar coincidencias exactas o parciales
  return activities.filter(activity => {
    const activityName = activity.actividad.toLowerCase()
    return activityName.includes(normalized) || normalized.includes(activityName)
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
  if (userIntensity) {
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

