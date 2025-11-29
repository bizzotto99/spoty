/**
 * Funciones para interactuar con la tabla de label_records en Supabase
 */

import { supabase } from './supabase'

/**
 * Obtiene un label_record por su texto
 */
export async function getLabelRecordByText(texto: string) {
  const { data, error } = await supabase
    .from('label_records')
    .select('*')
    .eq('texto', texto)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error obteniendo label_record:', error)
    throw error
  }

  return data
}

/**
 * Obtiene todos los label_records
 */
export async function getAllLabelRecords() {
  const { data, error } = await supabase
    .from('label_records')
    .select('*')
    .order('texto', { ascending: true })

  if (error) {
    console.error('Error obteniendo label_records:', error)
    throw error
  }

  return data || []
}

/**
 * Crea un nuevo label_record
 */
export async function createLabelRecord(texto: string) {
  const { data, error } = await supabase
    .from('label_records')
    .insert({ texto })
    .select()
    .single()

  if (error) {
    console.error('Error creando label_record:', error)
    throw error
  }

  return data
}

