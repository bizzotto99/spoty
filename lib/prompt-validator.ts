/**
 * Funciones para validar el prompt del usuario
 */

import { findMatchingActivities } from "./activity-matcher"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Valida que el prompt tenga los campos obligatorios
 */
export function validatePrompt(prompt: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const promptLower = prompt.toLowerCase().trim()

  // Validar actividad (obligatorio)
  const activities = findMatchingActivities(prompt)
  if (activities.length === 0) {
    errors.push("Debes especificar una actividad (ej: correr, estudiar, trabajar, relajarte)")
  }

  // Validar tiempo (obligatorio)
  const timePatterns = [
    /(\d+)\s*(?:hora|horas|hr|hrs|h)\s*(?:y|,)?\s*(\d+)?\s*(?:minuto|minutos|min|mins)?/i,
    /(\d+)\s*(?:minuto|minutos|min|mins)/i,
    /aprox(?:imadamente)?\s*(\d+)\s*(?:minuto|minutos|min|mins)/i,
    /(\d+)\s*(?:min|mins)/i,
  ]

  let hasTime = false
  for (const pattern of timePatterns) {
    if (pattern.test(promptLower)) {
      hasTime = true
      break
    }
  }

  if (!hasTime) {
    errors.push("Debes especificar la duración (ej: 45 minutos, 1 hora, 2 horas)")
  }

  // Validar intensidad (opcional, pero recomendado)
  const intensityKeywords = [
    'chill', 'más chill', 'relajada', 'suave',
    'media', 'moderada',
    'alta', 'fuerte', 'entrenamiento fuerte', 'intensa', 'muy alta'
  ]
  
  const hasIntensity = intensityKeywords.some(keyword => 
    promptLower.includes(keyword)
  )

  if (!hasIntensity && activities.length > 0) {
    warnings.push("Puedes especificar la intensidad para mejores resultados (ej: más chill, entrenamiento fuerte)")
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

