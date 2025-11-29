# Análisis de Rate Limiting de Spotify API

## Resumen

Este documento detalla todas las consultas (requests) que se hacen a la API de Spotify cuando se genera una playlist, explicando por qué pueden superar el rate limit.

## Rate Limits de Spotify

Spotify tiene límites de rate limiting que varían según el tipo de endpoint:
- **Límite general**: ~100 requests por segundo por usuario
- **Algunos endpoints específicos**: límites más bajos
- **Límite global por aplicación**: Puede variar según el plan

## Consultas Realizadas al Generar una Playlist

### Ejemplo: Playlist de 45 minutos

Con "quiero una playlist para correr de 45 minutos":
- **Necesitamos**: 13 canciones (45 ÷ 3.5 minutos promedio)
- **Buscamos**: 18 tracks iniciales (13 + 5 margen)

---

## 1. Búsqueda de Artistas (`searchDalePlayArtists(10)`)

**Ubicación**: `lib/search-daleplay.ts` línea 189

### Requests realizadas:

| # | Endpoint | Descripción | Delay |
|---|----------|-------------|-------|
| 1 | `GET /search?q=Dale Play Records&type=album&limit=10&market=US` | Buscar 10 álbumes | 0ms |
| 2-11 | `GET /albums/{id}?market=US` | Detalles de cada álbum (para verificar label) | 500ms entre cada una |
| 12 | `GET /artists?ids={id1,id2,...}` | Info completa de hasta 10 artistas | 0ms |

**Total: ~12 requests** (1 búsqueda + hasta 10 álbumes + 1 request de artistas)

---

## 2. Búsqueda de Tracks (`searchDalePlayTracks(18)`)

**Ubicación**: `lib/search-daleplay.ts` línea 33

### Requests realizadas:

| # | Endpoint | Descripción | Delay |
|---|----------|-------------|-------|
| 1 | `GET /search?q=Dale Play Records&type=album&limit=10&market=US` | Buscar 10 álbumes | 0ms |
| 2-11 | `GET /albums/{id}?market=US` | Detalles de cada álbum (para verificar label) | 500ms entre cada una |
| 12-21 | `GET /albums/{id}/tracks?limit=50&market=US` | Tracks de cada álbum válido | 500ms entre cada una |
| 22 | `GET /tracks?ids={id1,id2,...}` | Info completa de hasta 50 tracks | 0ms |

**Total: ~22 requests** (1 búsqueda + hasta 10 álbumes + hasta 10 requests de tracks + 1 request de tracks completos)

**⚠️ NOTA**: Solo se hacen requests de tracks para álbumes que realmente tienen el label "Dale Play Records". Si solo 5 álbumes son válidos, serían ~17 requests.

---

## 3. Audio Features (si hay filtro BPM)

**Ubicación**: `app/api/generate-playlist/route.ts` línea 164

### Requests realizadas:

| # | Endpoint | Descripción | Delay |
|---|----------|-------------|-------|
| 1+ | `GET /audio-features?ids={id1,id2,...,id100}` | Features de tracks en lotes de 100 | 500ms entre lotes |

**Para 18 tracks**: **1 request** (todos caben en un lote)

**Para 100+ tracks**: **2+ requests** (con delay de 500ms entre lotes)

---

## Resumen Total de Requests

### Caso: Playlist de 45 minutos (13 canciones, busca 18 tracks)

```
searchDalePlayArtists(10):     ~12 requests
searchDalePlayTracks(18):      ~22 requests
Audio Features (18 tracks):     ~1 request
─────────────────────────────────────────
TOTAL:                          ~35 requests
```

### Caso: Playlist de 20 minutos (máximo, busca 25 tracks)

```
searchDalePlayArtists(10):     ~12 requests
searchDalePlayTracks(25):      ~22 requests (aún busca máximo 10 álbumes)
Audio Features (25 tracks):     ~1 request
─────────────────────────────────────────
TOTAL:                          ~35 requests
```

---

## ¿Por Qué Se Supera el Rate Limit?

### Problema 1: Múltiples Búsquedas Secuenciales

Aunque hay delays de 500ms entre requests, se hacen **múltiples requests por álbum**:

1. Request para obtener detalles del álbum (`/albums/{id}`)
2. Request para obtener tracks del álbum (`/albums/{id}/tracks`)

Si hay 10 álbumes válidos:
- **20 requests secuenciales** solo para tracks
- Con delay de 500ms = **10 segundos** de espera solo en delays

### Problema 2: Requests Redundantes

Se busca **2 veces la misma información**:

1. `searchDalePlayArtists` busca álbumes y los valida
2. `searchDalePlayTracks` **vuelve a buscar los mismos álbumes** y los valida de nuevo

**Solución potencial**: Compartir los álbumes ya validados entre ambas funciones.

### Problema 3: Rate Limit Acumulado

Si un usuario genera múltiples playlists en poco tiempo:
- Primera playlist: 35 requests
- Segunda playlist: 35 requests
- Tercera playlist: 35 requests
- **Total: 105 requests en ~1-2 minutos**

Aunque cada request individual respeta los delays, Spotify puede tener límites globales por aplicación o por usuario que se acumulan.

---

## Límites de Spotify API

Según la documentación de Spotify:

1. **Rate Limits por Endpoint**:
   - `/search`: Alto límite
   - `/albums/{id}`: Medio límite
   - `/audio-features`: Alto límite
   - Límite general: ~100 requests/segundo

2. **Rate Limits Acumulados**:
   - Pueden haber límites por ventana de tiempo (ej: 1000 requests/hora)
   - Límites por aplicación (no solo por usuario)

3. **Código de Error 429**:
   - Spotify responde con `429 Too Many Requests`
   - Header `Retry-After`: indica segundos a esperar
   - Puede variar desde segundos hasta minutos

---

## Optimizaciones Aplicadas

### ✅ Ya Implementadas:

1. **Delays entre requests**: 500ms entre requests de álbumes/tracks
2. **Límite de búsqueda**: Máximo 10 álbumes por búsqueda
3. **Cálculo dinámico**: Solo busca la cantidad de tracks necesarios (no siempre 50)
4. **Retry logic**: Manejo de errores 429 con retry y espera
5. **Fail-fast**: Si `Retry-After` > 2 minutos, falla inmediatamente

### ⚠️ Pendientes (Mejoras Futuras):

1. **Cache de artistas/tracks**: Guardar en Supabase para no buscar cada vez
2. **Compartir álbumes validados**: No buscar álbumes 2 veces
3. **Batch requests más grandes**: Si es posible, combinar requests
4. **Pre-cachear**: Buscar y cachear tracks de Dale Play al inicio del día

---

## Recomendaciones

### Para Reducir Rate Limiting:

1. **Implementar caché en Supabase**:
   - Guardar artistas y tracks de Dale Play
   - Actualizar cache cada X horas (no en cada request)
   - Reduciría de ~35 requests a ~3-5 requests

2. **Reutilizar datos entre funciones**:
   - `searchDalePlayArtists` y `searchDalePlayTracks` deberían compartir álbumes validados
   - Reduciría ~12 requests a ~0 requests (si ya están en cache)

3. **Optimizar búsqueda de álbumes**:
   - Si ya sabemos los álbumes válidos, no buscar de nuevo
   - Reduciría ~22 requests a ~12 requests (solo tracks, no álbumes)

### Implementación Sugerida:

```typescript
// Pseudocódigo optimizado
const cachedDalePlayData = await getCachedDalePlayData() // Desde Supabase

if (!cachedDalePlayData || isCacheExpired()) {
  // Solo hacer requests si no hay cache
  const albums = await searchAlbums("Dale Play Records")
  const validatedAlbums = await validateAlbums(albums) // 10 requests
  const artists = extractArtists(validatedAlbums)
  const tracks = await getTracksFromAlbums(validatedAlbums) // 10 requests
  await saveToCache(artists, tracks) // Guardar en Supabase
} else {
  // Usar cache, cero requests a Spotify
  const artists = cachedDalePlayData.artists
  const tracks = cachedDalePlayData.tracks
}
```

**Con cache**: ~0-2 requests (solo validar que cache esté actualizado)
**Sin cache**: ~35 requests (como actualmente)

---

## Conclusión

Actualmente se hacen **~35 requests a Spotify** para generar una playlist, lo cual puede superar el rate limit especialmente si:
- Se generan múltiples playlists en poco tiempo
- Spotify tiene límites acumulativos por aplicación
- Hay picos de uso simultáneo de múltiples usuarios

La mejor solución es **implementar caché en Supabase** para reducir de ~35 requests a ~0-3 requests por playlist.

