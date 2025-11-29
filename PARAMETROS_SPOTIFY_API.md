# 📋 Parámetros de Consultas a Spotify API

Documento detallado de todos los parámetros usados en las consultas a Spotify.

---

## 🔍 1. Búsqueda de Álbumes

**Endpoint**: `GET /search`

**URL completa**: 
```
GET https://api.spotify.com/v1/search?q=label:"Dale Play Records"&type=album&limit=8&market=US
```

**Parámetros**:
- `q`: `label:"Dale Play Records"` - Query de búsqueda por label
- `type`: `album` - Tipo de búsqueda (solo álbumes)
- `limit`: `8` - Máximo 8 álbumes (reducido de 10)
- `market`: `US` - Mercado para búsqueda

**Cantidad**: 1 request por playlist (sin cache)

---

## 📀 2. Detalles de Álbum

**Endpoint**: `GET /albums/{id}`

**URL completa**: 
```
GET https://api.spotify.com/v1/albums/{album_id}?market=US
```

**Parámetros**:
- `{album_id}`: ID del álbum (ej: `4uLU6hMCjMI75M1A2tKUQC`)
- `market`: `US` - Mercado para obtener información

**Cantidad**: Hasta 8 requests (una por cada álbum validado)
**Delay**: 500ms entre cada request (excepto la primera)

---

## 🎵 3. Tracks de Álbum

**Endpoint**: `GET /albums/{id}/tracks`

**URL completa**: 
```
GET https://api.spotify.com/v1/albums/{album_id}/tracks?limit=50&market=US
```

**Parámetros**:
- `{album_id}`: ID del álbum
- `limit`: `50` - Máximo 50 tracks por álbum (límite de Spotify)
- `market`: `US` - Mercado para obtener tracks

**Cantidad**: Hasta 8 requests (una por cada álbum validado)
**Delay**: 500ms entre cada request (excepto la primera)

---

## 🎤 4. Información de Artistas

**Endpoint**: `GET /artists?ids={ids}`

**URL completa**: 
```
GET https://api.spotify.com/v1/artists?ids={id1,id2,id3,...}&market=US
```

**Parámetros**:
- `ids`: Lista de IDs de artistas separados por coma (máximo 50)
- `market`: `US` - Mercado (opcional, pero incluido)

**Ejemplo real**:
```
GET /artists?ids=4Z8W4fKeB5YxbusRsdQVPb,2CIMQHirSU0MQqyYHq0eOx,57dN52uHvrHOxijzpIgu3E
```

**Cantidad**: 1 request (combinado para todos los artistas)
**Delay**: 500ms antes del request
**Límite**: Máximo 50 artistas por request

---

## 🎧 5. Información Completa de Tracks

**Endpoint**: `GET /tracks?ids={ids}`

**URL completa**: 
```
GET https://api.spotify.com/v1/tracks?ids={id1,id2,id3,...}&market=US
```

**Parámetros**:
- `ids`: Lista de IDs de tracks separados por coma (máximo 50)
- `market`: `US` - Mercado para obtener información completa

**Ejemplo real**:
```
GET /tracks?ids=7ouMYWpwJ422jRcDASZB7P,4VqPOruhp5EdPBeR92t6lQ,2takcwOaAZWiXQijPHIx7B
```

**Cantidad**: 1 request (combinado para todos los tracks, máximo 50)
**Delay**: 500ms antes del request
**Límite**: Máximo 50 tracks por request

---

## 🎚️ 6. Audio Features (BPM, Energy, etc.)

**Endpoint**: `GET /audio-features?ids={ids}`

**URL completa**: 
```
GET https://api.spotify.com/v1/audio-features?ids={id1,id2,id3,...}
```

**Parámetros**:
- `ids`: Lista de IDs de tracks separados por coma (máximo 100 por request)

**Ejemplo real**:
```
GET /audio-features?ids=7ouMYWpwJ422jRcDASZB7P,4VqPOruhp5EdPBeR92t6lQ,2takcwOaAZWiXQijPHIx7B,...
```

**Cantidad**: 1+ requests (lotes de 100 tracks)
**Delay**: 500ms entre lotes
**Límite**: Máximo 100 tracks por request (límite de Spotify)

**Cuándo se usa**: Solo si hay filtro BPM en los criterios de la playlist

---

## 📊 Resumen de Parámetros por Request

### Primera Playlist (Sin Cache):

| # | Endpoint | Parámetros | Cantidad | Delay |
|---|----------|------------|----------|-------|
| 1 | `/search` | `q=label:"Dale Play Records"`, `type=album`, `limit=8`, `market=US` | 1 | 0ms |
| 2-9 | `/albums/{id}` | `market=US` | Hasta 8 | 500ms |
| 10-17 | `/albums/{id}/tracks` | `limit=50`, `market=US` | Hasta 8 | 500ms |
| 18 | `/artists?ids=...` | `ids={comma-separated}`, `market=US` | 1 | 500ms |
| 19 | `/tracks?ids=...` | `ids={comma-separated}`, `market=US` | 1 | 500ms |
| 20+ | `/audio-features?ids=...` | `ids={comma-separated}` | 1+ (si hay BPM) | 500ms |

**Total**: ~19-20 requests (sin filtro BPM) o ~20-21 requests (con filtro BPM)

### Segunda Playlist (Con Cache):

| # | Endpoint | Parámetros | Cantidad | Delay |
|---|----------|------------|----------|-------|
| 1+ | `/audio-features?ids=...` | `ids={comma-separated}` | 1+ (solo si hay BPM) | 500ms |

**Total**: ~1 request (solo audio features si hay filtro BPM)

---

## 🎯 Valores Fijos Usados

### Búsqueda:
- **Query**: `label:"Dale Play Records"` (siempre)
- **Tipo**: `album` (siempre)
- **Límite de álbumes**: `8` (reducido de 10)
- **Market**: `US` (siempre)

### Límites:
- **Artistas**: Máximo `10` por búsqueda
- **Tracks iniciales**: Máximo `25` (calculado dinámicamente según duración)
- **Tracks por álbum**: `50` (límite de Spotify)
- **Artistas por request**: `50` (límite de Spotify)
- **Tracks por request**: `50` (límite de Spotify)
- **Audio features por request**: `100` (límite de Spotify)

### Delays:
- **Entre requests de álbumes**: `500ms`
- **Entre requests de tracks**: `500ms`
- **Antes de request combinado**: `500ms`
- **En caso de rate limit (429)**: `5000ms` (5 segundos)

---

## 🔐 Autenticación

**Header en todas las requests**:
```
Authorization: Bearer {access_token}
```

El `access_token` se obtiene de:
- Cookies: `spotify_access_token`
- Se renueva automáticamente si expira usando `spotify_refresh_token`

---

## 📈 Ejemplo de Flujo Completo

### Sin Cache (Primera vez):

```
1. GET /search?q=label:"Dale Play Records"&type=album&limit=8&market=US
   ↓ (500ms delay)
2. GET /albums/album1?market=US
   ↓ (500ms delay)
3. GET /albums/album2?market=US
   ↓ (500ms delay)
   ... (hasta 8 álbumes)
   ↓ (500ms delay)
9. GET /albums/album1/tracks?limit=50&market=US
   ↓ (500ms delay)
10. GET /albums/album2/tracks?limit=50&market=US
   ↓ (500ms delay)
   ... (hasta 8 álbumes)
   ↓ (500ms delay)
17. GET /artists?ids=artist1,artist2,...,artist10&market=US
   ↓ (500ms delay)
18. GET /tracks?ids=track1,track2,...,track25&market=US
   ↓ (500ms delay, solo si hay BPM)
19. GET /audio-features?ids=track1,track2,...,track25
```

### Con Cache (Segunda vez en adelante):

```
1. (Lee desde Supabase - 0 requests a Spotify)
   ↓ (solo si hay filtro BPM)
2. GET /audio-features?ids=track1,track2,...,track25
```

---

## ⚠️ Manejo de Rate Limiting

Si Spotify devuelve `429 Too Many Requests`:

1. **Lee el header `Retry-After`**
2. **Espera el tiempo indicado** (o máximo 2 minutos)
3. **Si `Retry-After` > 2 minutos**: Falla inmediatamente con error
4. **Reintenta** hasta 5 veces máximo

---

## 📝 Notas Importantes

1. **Market siempre US**: Todas las búsquedas usan `market=US`
2. **Límites de Spotify respetados**: Nunca excedemos 50 artistas, 50 tracks, o 100 audio features por request
3. **Delays entre requests**: 500ms para evitar rate limiting
4. **Cache reduce requests**: Después de la primera búsqueda, casi todas las requests se eliminan
5. **Validación de label**: Solo se procesan álbumes que realmente tengan "Dale Play Records" como label (case-insensitive)

---

## 🔄 Actualización de Parámetros

Si necesitas cambiar algún parámetro, modifica estos valores:

- **Límite de álbumes**: `MAX_ALBUMS_TO_SEARCH = 8` en `lib/search-daleplay-optimized.ts`
- **Límite de artistas**: `artistsLimit` en `searchDalePlayDataOptimized()` (default: 10)
- **Límite de tracks**: Calculado dinámicamente en `extractDurationAndCalculateTracks()` (default: 15-25)
- **Delays**: `500` ms en múltiples lugares del código
- **Market**: `US` hardcodeado en varias funciones

