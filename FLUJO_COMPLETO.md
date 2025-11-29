# 🎵 Flujo Completo: Desde Prompt hasta Exportar Playlist

Este documento describe el flujo completo desde que el usuario ingresa un prompt hasta que se muestra la lista de canciones lista para exportar.

## 📋 Resumen del Flujo

```
1. Usuario ingresa prompt
   ↓
2. Validación del prompt
   ↓
3. Estado: 'loading' (mostrando spinner)
   ↓
4. Llamada a /api/generate-playlist
   ↓
5. OpenAI selecciona canciones específicas
   ↓
6. Búsqueda de canciones en Spotify
   ↓
7. Retorno de tracks al frontend
   ↓
8. Estado: 'preview' (mostrando lista de canciones)
   ↓
9. Usuario puede editar, eliminar, reordenar
   ↓
10. Usuario exporta a Spotify
```

---

## 🔍 Flujo Detallado

### 1. **Usuario ingresa prompt** (`app/page.tsx`)

**Archivo**: `app/page.tsx` (línea ~126)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validaciones:
  // - Usuario autenticado
  // - Prompt no vacío
  // - Validación con validatePrompt()
  
  // Cambia estado a 'loading'
  setFlowState('loading')
  
  // Llama a generateTracks()
  const result = await generateTracks(prompt)
  
  // Cambia estado a 'preview'
  setFlowState('preview')
}
```

### 2. **Función `generateTracks`** (`app/page.tsx`)

**Archivo**: `app/page.tsx` (línea ~102)

```typescript
const generateTracks = async (promptText: string) => {
  // Hace POST a /api/generate-playlist
  const response = await fetch("/api/generate-playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ prompt: promptText }),
  })
  
  const data = await response.json()
  
  return {
    tracks: data.tracks,           // Array de Track[]
    playlistName: data.playlistName, // String
    description: data.description,    // String
  }
}
```

### 3. **API Route `/api/generate-playlist`** (`app/api/generate-playlist/route.ts`)

**Archivo**: `app/api/generate-playlist/route.ts`

**Pasos internos**:

1. **Obtener token de acceso** (línea ~18)
   ```typescript
   const accessToken = cookieStore.get("spotify_access_token")?.value
   ```

2. **Calcular cantidad de tracks** (línea ~39)
   ```typescript
   const maxTracksNeeded = extractDurationAndCalculateTracks(prompt.trim())
   // Extrae duración del prompt o usa 20 minutos por defecto
   ```

3. **Llamar a OpenAI** (línea ~43)
   ```typescript
   const trackSelection = await selectTracksWithOpenAI(
     prompt.trim(),
     { artists: [], genres: [] }, // Sin datos previos
     maxTracksNeeded
   )
   ```
   - OpenAI devuelve: `{ playlistName, description, tracks: [{ trackName, artistName }] }`

4. **Buscar tracks en Spotify** (línea ~86)
   ```typescript
   const tracks = await searchSpecificTracks(trackQueries, accessToken)
   ```
   - Busca cada track específico usando `track:"nombre" artist:"artista"`
   - Retorna array de `Track[]` con datos completos de Spotify

5. **Retornar respuesta** (línea ~100)
   ```typescript
   return NextResponse.json({
     success: true,
     playlistName: trackSelection.playlistName,
     description: trackSelection.description,
     tracks, // Array completo de Track[]
   })
   ```

### 4. **Vista de Preview** (`app/page.tsx`)

**Archivo**: `app/page.tsx` (línea ~606)

Cuando `flowState === 'preview'`:

#### Componentes mostrados:

1. **Botón Back** (línea ~609)
   - Abre modal de confirmación
   - Opciones: "Cancel", "Discard", "Export to Spotify"

2. **Card de Playlist** (línea ~618)
   - Imagen: `/playlist.png`
   - Nombre editable
   - Contador de canciones
   - Botones: "Regenerate", "Export to Spotify"

3. **Input de edición con IA** (línea ~736)
   - Permite editar playlist con prompts
   - Usa `handleEditWithAI()` para regenerar

4. **Lista de canciones** (línea ~774)
   - Cada track muestra:
     - Número de orden
     - Imagen del álbum
     - Nombre de la canción
     - Nombre del artista
     - Audio preview (30 segundos)
     - Duración
     - Botón para eliminar
   - **Drag and drop** para reordenar
   - **Eliminar tracks** individuales

### 5. **Funcionalidades en Preview**

#### **Editar nombre** (línea ~637)
```typescript
// Click en icono de editar
setIsEditingName(true)

// Input editable aparece
// Enter o click en Save guarda
handleSaveName()
```

#### **Eliminar track** (línea ~306)
```typescript
const handleDeleteTrack = (trackId: string) => {
  setTracks(tracks.filter(track => track.id !== trackId))
}
```

#### **Reordenar tracks** (línea ~315)
```typescript
// Drag and drop
handleDragStart(index)    // Inicia drag
handleDragOver(e)         // Permite drop
handleDrop(e, dropIndex)  // Reordena array
```

#### **Editar con IA** (línea ~275)
```typescript
const handleEditWithAI = async (e: React.FormEvent) => {
  // Toma el editPrompt
  // Llama a generateTracks(editPrompt)
  // Reemplaza los tracks actuales
}
```

### 6. **Exportar a Spotify** (`app/page.tsx`)

**Archivo**: `app/page.tsx` (línea ~206)

```typescript
const handleCreatePlaylist = async () => {
  setFlowState('creating') // Muestra loading
  
  // POST a /api/create-playlist
  const response = await fetch("/api/create-playlist", {
    method: "POST",
    body: JSON.stringify({
      name: playlistName,
      description: "",
      tracks: tracks.map(track => ({ uri: track.uri })),
    }),
  })
  
  setFlowState('success') // Muestra éxito con link a Spotify
}
```

---

## 📦 Interfaces y Tipos

### **Track** (`app/page.tsx`)
```typescript
interface Track {
  id: string
  name: string
  artist: string
  album: string
  image: string
  duration_ms: number
  preview_url?: string
  uri: string
}
```

### **TrackSelectionResult** (`lib/openai-track-selection.ts`)
```typescript
interface TrackSelectionResult {
  playlistName: string
  description: string
  tracks: SelectedTrack[]
}

interface SelectedTrack {
  trackName: string
  artistName: string
  reason?: string
}
```

---

## 🔄 Estados del Flujo

1. **`idle`**: Estado inicial, muestra input
2. **`loading`**: Generando playlist, muestra spinner
3. **`preview`**: Lista de canciones lista para editar/exportar
4. **`creating`**: Creando playlist en Spotify
5. **`success`**: Playlist creada, muestra link

---

## ✅ Checklist de Funcionalidades

- [x] Validación de prompt antes de enviar
- [x] Spinner de carga con mensajes animados
- [x] OpenAI selecciona canciones específicas
- [x] Búsqueda de tracks en Spotify
- [x] Vista de preview con lista de canciones
- [x] Editar nombre de playlist
- [x] Eliminar tracks individuales
- [x] Reordenar tracks (drag and drop)
- [x] Editar playlist con IA
- [x] Regenerar playlist completa
- [x] Botón Back con confirmación
- [x] Exportar a Spotify
- [x] Vista de éxito con link

---

## 🐛 Posibles Problemas y Soluciones

### **No se muestran las canciones**
- Verificar que `/api/generate-playlist` retorne `tracks` como array
- Verificar que `setFlowState('preview')` se ejecute después de recibir tracks
- Revisar logs del navegador para errores de fetch

### **Tracks no se encuentran en Spotify**
- OpenAI puede devolver nombres inexactos
- Verificar logs de `searchSpecificTracks` para ver cuáles no se encontraron
- Revisar que el formato de búsqueda sea correcto: `track:"nombre" artist:"artista"`

### **Error al exportar**
- Verificar que `track.uri` esté presente en cada track
- Verificar autenticación de Spotify
- Revisar permisos de creación de playlists

---

## 📝 Notas Importantes

1. **Límite de canciones**: Máximo 20 canciones por playlist
2. **Duración por defecto**: 20 minutos si no se especifica en el prompt
3. **Búsqueda específica**: Solo busca las canciones exactas que OpenAI selecciona
4. **Rate limiting**: Hay delays de 500ms entre búsquedas para evitar rate limits
5. **Imagen de playlist**: Siempre usa `/playlist.png` como imagen por defecto

