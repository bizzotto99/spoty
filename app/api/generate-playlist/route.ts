import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { extractDurationAndCalculateTracks } from "@/lib/openai"
import { selectTracksFromCatalog } from "@/lib/openai-track-selection"
import { getCachedDalePlayTracks, saveDalePlayTracksToCache } from "@/lib/supabase-daleplay-cache"
import { searchDalePlayTracksOptimized } from "@/lib/search-daleplay-optimized"

// Configurar tiempo máximo de ejecución: 300 segundos (5 minutos)
export const maxDuration = 300

/**
 * API Route para generar playlist usando OpenAI + Cache de Supabase
 * 
 * NUEVO FLUJO OPTIMIZADO:
 * 1. Leer tracks de Dale Play Records desde cache de Supabase (0 requests a Spotify)
 * 2. Si no hay cache o está expirado, buscar en Spotify y guardar en cache
 * 3. OpenAI selecciona los mejores tracks del catálogo según el prompt
 * 4. Retornar tracks seleccionados (ya tenemos toda la info)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener token de acceso de las cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "No autenticado. Por favor conecta tu cuenta de Spotify." },
        { status: 401 }
      )
    }

    // 2. Obtener el prompt del body
    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "El prompt es requerido" },
        { status: 400 }
      )
    }

    // 3. Calcular cantidad de tracks necesarios
    const maxTracksNeeded = extractDurationAndCalculateTracks(prompt.trim())
    console.log(`📊 Playlist solicitada: ${maxTracksNeeded} canciones`)

    // 4. INTENTAR LEER TRACKS DEL CACHE DE SUPABASE
    console.log(`🔍 Buscando tracks de Dale Play Records en cache...`)
    let availableTracks = await getCachedDalePlayTracks()

    // 5. SI NO HAY CACHE, BUSCAR EN SPOTIFY Y GUARDAR
    if (!availableTracks || availableTracks.length === 0) {
      console.log(`⚠️ Cache vacío o expirado. Buscando en Spotify...`)
      
      try {
        // Buscar tracks en Spotify (esto hace varios requests pero solo 1 vez cada 24h)
        availableTracks = await searchDalePlayTracksOptimized(accessToken, 100)
        
        if (!availableTracks || availableTracks.length === 0) {
          return NextResponse.json(
            { error: "No se encontraron tracks de Dale Play Records en Spotify" },
            { status: 404 }
          )
        }

        // Guardar en cache para las próximas 24 horas
        await saveDalePlayTracksToCache(availableTracks)
        console.log(`✅ Cache actualizado: ${availableTracks.length} tracks guardados en Supabase`)
        
      } catch (error) {
        console.error("Error buscando tracks en Spotify:", error)
        return NextResponse.json(
          { 
            error: "Error al buscar tracks de Dale Play Records en Spotify",
            message: error instanceof Error ? error.message : "Error desconocido"
          },
          { status: 500 }
        )
      }
    } else {
      console.log(`✅ Cache hit: ${availableTracks.length} tracks disponibles de Dale Play Records`)
    }

    // 6. VALIDAR QUE TENGAMOS SUFICIENTES TRACKS
    if (availableTracks.length < maxTracksNeeded) {
      console.warn(`⚠️ Solo hay ${availableTracks.length} tracks disponibles, pero se pidieron ${maxTracksNeeded}`)
      // Ajustar maxTracksNeeded al número de tracks disponibles
      const adjustedMax = Math.min(maxTracksNeeded, availableTracks.length)
      console.log(`📊 Ajustando a ${adjustedMax} canciones`)
    }

    // 7. OPENAI SELECCIONA LOS MEJORES TRACKS DEL CATÁLOGO
    console.log(`🤖 OpenAI seleccionando ${maxTracksNeeded} canciones del catálogo...`)
    const selection = await selectTracksFromCatalog(
      prompt.trim(),
      availableTracks,
      Math.min(maxTracksNeeded, availableTracks.length)
    )

    // 8. OBTENER LOS TRACKS SELECCIONADOS POR SUS IDs
    const selectedTracks = availableTracks.filter(track => 
      selection.selectedTrackIds.includes(track.id)
    )

    if (selectedTracks.length === 0) {
      return NextResponse.json(
        {
          error: "OpenAI no pudo seleccionar tracks válidos. Intenta con otro prompt.",
          selectedIds: selection.selectedTrackIds,
        },
        { status: 400 }
      )
    }

    // 9. RETORNAR RESULTADOS
    console.log(`✅ Playlist generada: ${selection.playlistName} con ${selectedTracks.length} canciones`)
    console.log(`📊 RESUMEN:`)
    console.log(`   - Tracks disponibles en catálogo: ${availableTracks.length}`)
    console.log(`   - Tracks seleccionados por OpenAI: ${selectedTracks.length}`)
    console.log(`   - Requests a Spotify API: 0 (todo desde cache)`)
    
    return NextResponse.json({
      success: true,
      playlistName: selection.playlistName,
      description: selection.description,
      tracks: selectedTracks,
    })
    
  } catch (error) {
    console.error("Error generando playlist:", error)
    
    return NextResponse.json(
      {
        error: "Error generando playlist",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}
