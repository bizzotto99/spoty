# 📝 Logs de Requests a Spotify API

Se agregaron logs detallados antes y después de cada request a la API de Spotify para facilitar el debugging y seguimiento de problemas.

---

## 🎯 Logs Implementados

### 1. Función Base (`lib/spotify.ts`)

**ANTES de cada request:**
```
[Spotify API Request #1] 2024-01-15T10:30:45.123Z
  Method: GET
  Endpoint: /search?q=...
  Full URL: https://api.spotify.com/v1/search?q=...
```

**DESPUÉS de cada respuesta:**
```
[Spotify API Response] 2024-01-15T10:30:45.456Z
  Status: 200 OK
```

**Si hay error:**
```
  ❌ Error en request: /search?q=...
```

**Si hay rate limiting:**
```
[Spotify API] Rate limit alcanzado. Esperando 10.0s antes de reintentar... (intento 1/5)
```

---

### 2. Búsqueda de Álbumes (`lib/search-daleplay-optimized.ts`)

**Búsqueda inicial:**
```
[searchAndValidateDalePlayAlbums] 🔍 Buscando álbumes del label "Dale Play Records"...
[Spotify API Request #1] ...
```

**Detalles de cada álbum:**
```
[searchAndValidateDalePlayAlbums] 📀 Obteniendo detalles del álbum: "Album Name" (ID: 123abc...)
[Spotify API Request #1] ...
```

---

### 3. Información de Artistas (`lib/search-daleplay-optimized.ts`)

```
[searchDalePlayArtistsOptimized] 🎤 Obteniendo información de 10 artistas...
[Spotify API Request #1] ...
```

---

### 4. Tracks de Álbumes (`lib/search-daleplay-optimized.ts`)

```
[searchDalePlayTracksOptimized] 🎵 Obteniendo tracks del álbum: "Album Name" (ID: 123abc...)
[Spotify API Request #1] ...
```

**Información completa de tracks:**
```
[searchDalePlayTracksOptimized] 🎧 Obteniendo información completa de 25 tracks...
[Spotify API Request #1] ...
```

---

### 5. Búsqueda de Tracks Específicos (`lib/search-specific-tracks.ts`)

**Cada track buscado:**
```
[searchSingleTrack] 🔍 Buscando: "Track Name" de "Artist Name"
[Spotify API Request #1] ...
```

**Resultados:**
```
✅ Encontrado: "Track Name" de "Artist Name"
❌ No encontrado: "Track Name" de "Artist Name"
```

**Resumen:**
```
🎵 Encontrados 18 de 20 tracks solicitados
```

---

### 6. Creación de Playlist (`lib/create-playlist.ts`)

**Crear playlist:**
```
[createPlaylistInSpotify] 🎵 Creando playlist: "Playlist Name" para usuario user123
[Spotify API Request #1] ...
```

**Agregar tracks (por lotes):**
```
[createPlaylistInSpotify] ➕ Agregando lote 1/2 de tracks (20 tracks) a playlist playlist123
[Spotify API Request #1] ...
```

**Subir imagen:**
```
[createPlaylistInSpotify] 🖼️ Subiendo imagen a playlist playlist123
[Spotify API Request #1] ...
```

---

## 📊 Ejemplo de Logs Completos

### Generación de Playlist:

```
🔍 Obteniendo artistas del label Dale Play Records para contexto...
[searchAndValidateDalePlayAlbums] 🔍 Buscando álbumes del label "Dale Play Records"...
[Spotify API Request #1] 2024-01-15T10:30:45.123Z
  Method: GET
  Endpoint: /search?q=label:"Dale Play Records"&type=album&limit=8&market=US
  Full URL: https://api.spotify.com/v1/search?q=...
[Spotify API Response] 2024-01-15T10:30:45.456Z
  Status: 200 OK

[searchAndValidateDalePlayAlbums] 📀 Obteniendo detalles del álbum: "Album 1" (ID: abc123)
[Spotify API Request #1] 2024-01-15T10:30:45.957Z
  Method: GET
  Endpoint: /albums/abc123?market=US
  Full URL: https://api.spotify.com/v1/albums/abc123?market=US
[Spotify API Response] 2024-01-15T10:30:46.123Z
  Status: 200 OK

... (más álbumes) ...

[searchDalePlayArtistsOptimized] 🎤 Obteniendo información de 10 artistas...
[Spotify API Request #1] 2024-01-15T10:30:52.456Z
  Method: GET
  Endpoint: /artists?ids=artist1,artist2,...
  Full URL: https://api.spotify.com/v1/artists?ids=...
[Spotify API Response] 2024-01-15T10:30:52.789Z
  Status: 200 OK

🤖 OpenAI seleccionando 13 canciones específicas del label...
🔍 Buscando 13 canciones específicas en Spotify...

[searchSingleTrack] 🔍 Buscando: "Song 1" de "Artist 1"
[Spotify API Request #1] 2024-01-15T10:31:05.123Z
  Method: GET
  Endpoint: /search?q=track:"Song 1" artist:"Artist 1"&type=track&limit=5&market=US
  Full URL: https://api.spotify.com/v1/search?q=...
[Spotify API Response] 2024-01-15T10:31:05.456Z
  Status: 200 OK
✅ Encontrado: "Song 1" de "Artist 1"

... (más tracks) ...
```

---

## 🔍 Cómo Usar los Logs para Debugging

### 1. Identificar Rate Limiting:

Busca en los logs:
```
[Spotify API] Rate limit alcanzado. Esperando 10.0s antes de reintentar...
```

Esto te dirá:
- En qué request ocurrió
- Qué endpoint fue
- Cuánto tiempo espera

### 2. Encontrar Requests Fallidos:

Busca:
```
❌ Error en request: /endpoint
Status: 429 Too Many Requests
```

O:
```
Status: 404 Not Found
```

### 3. Ver el Flujo Completo:

Los logs están organizados por función, así que puedes seguir:
- Qué función está ejecutando
- Qué request está haciendo
- Cuál fue el resultado

### 4. Timing:

Cada log tiene un timestamp ISO, así que puedes calcular:
- Cuánto tarda cada request
- Si hay delays excesivos
- Cuándo ocurren los rate limits

---

## 📝 Formato de los Logs

### Nivel 1: Función/Escenario
```
[searchAndValidateDalePlayAlbums] ...
[createPlaylistInSpotify] ...
```

### Nivel 2: Request Específico
```
[Spotify API Request #1] ...
[Spotify API Response] ...
```

### Nivel 3: Resultado
```
✅ Encontrado: ...
❌ No encontrado: ...
```

---

## ⚙️ Ubicación de los Logs

Los logs aparecen en:
- **Desarrollo**: Terminal donde ejecutas `npm run dev`
- **Producción (Vercel)**: Dashboard de Vercel → Deployments → View Function Logs
- **Local**: Console del servidor

---

## 🎯 Beneficios

1. **Debugging Rápido**: Sabes exactamente qué request falló
2. **Monitoreo**: Puedes ver el flujo completo de requests
3. **Rate Limiting**: Identificas dónde y cuándo ocurre
4. **Performance**: Mides tiempos de cada request
5. **Tracking**: Sigues el progreso de cada operación

---

## ✅ Implementado

Todos los logs están implementados y compilando correctamente. Los verás en cada request a Spotify API.

