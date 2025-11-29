/**
 * Funciones para interactuar con la tabla de usuarios en Supabase
 */

import { supabase } from './supabase'

export interface UserData {
  email: string
  spotify_user_id: string
  label_record_id?: string
}

/**
 * Obtiene un usuario por su Spotify user ID
 */
export async function getUserBySpotifyId(spotifyUserId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('spotify_user_id', spotifyUserId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error obteniendo usuario:', error)
    throw error
  }

  return data
}

/**
 * Crea o actualiza un usuario
 */
export async function upsertUser(userData: UserData) {
  // Primero, obtener o crear el label_record si se proporciona
  let labelRecordId: string | undefined = undefined

  if (userData.label_record_id) {
    // Si se proporciona un ID directo, usarlo
    labelRecordId = userData.label_record_id
  } else {
    // Buscar o crear "Dale Play Records"
    const { data: labelRecord } = await supabase
      .from('label_records')
      .select('id')
      .eq('texto', 'Dale Play Records')
      .single()

    if (labelRecord) {
      labelRecordId = labelRecord.id
    }
  }

  const { data, error } = await supabase
    .from('users')
    .upsert({
      email: userData.email,
      spotify_user_id: userData.spotify_user_id,
      label_record_id: labelRecordId,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'spotify_user_id',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creando/actualizando usuario:', error)
    throw error
  }

  return data
}

/**
 * Verifica si un email existe en la tabla de usuarios
 * Retorna true si existe, false si no existe
 */
export async function userExistsByEmail(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error verificando usuario por email:', error)
    throw error
  }

  return !!data
}

/**
 * Obtiene un usuario por su email
 */
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error obteniendo usuario por email:', error)
    throw error
  }

  return data
}

/**
 * Obtiene el label_record de un usuario
 */
export async function getUserLabelRecord(spotifyUserId: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      label_record_id,
      label_records (
        id,
        texto
      )
    `)
    .eq('spotify_user_id', spotifyUserId)
    .single()

  if (error) {
    console.error('Error obteniendo label_record del usuario:', error)
    throw error
  }

  return data
}

