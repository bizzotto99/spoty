# 🗄️ Configuración de Cache en Supabase

## Verificar si las tablas ya existen

Ejecuta esta query en el SQL Editor de Supabase:

```sql
-- Verificar tablas existentes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('dale_play_artists_cache', 'dale_play_tracks_cache');
```

Si ya existen las dos tablas, **puedes saltar al paso 3**.

---

## Paso 1: Crear las tablas de cache

Si las tablas **NO existen**, ejecuta esto en Supabase SQL Editor:

```sql
-- Tabla para cachear artistas de Dale Play Records
CREATE TABLE IF NOT EXISTS dale_play_artists_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id TEXT NOT NULL UNIQUE,
  artist_name TEXT NOT NULL,
  genres TEXT[] DEFAULT '{}',
  popularity INTEGER DEFAULT 0,
  image_url TEXT,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Tabla para cachear tracks de Dale Play Records
CREATE TABLE IF NOT EXISTS dale_play_tracks_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id TEXT NOT NULL UNIQUE,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  preview_url TEXT,
  uri TEXT NOT NULL,
  album_id TEXT,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_artists_cache_expires ON dale_play_artists_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_tracks_cache_expires ON dale_play_tracks_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_tracks_cache_artist ON dale_play_tracks_cache(artist_name);
```

✅ **Success. No rows returned** = Tablas creadas correctamente

---

## Paso 2: Configurar permisos (RLS)

Ejecuta esto para permitir que la aplicación lea y escriba en el cache:

```sql
-- Habilitar RLS en las tablas
ALTER TABLE dale_play_artists_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE dale_play_tracks_cache ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública (cualquiera puede leer el cache)
DROP POLICY IF EXISTS "Allow public read access artists" ON dale_play_artists_cache;
CREATE POLICY "Allow public read access artists" ON dale_play_artists_cache
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access tracks" ON dale_play_tracks_cache;
CREATE POLICY "Allow public read access tracks" ON dale_play_tracks_cache
  FOR SELECT USING (true);

-- Permitir inserción/actualización pública (para guardar cache)
DROP POLICY IF EXISTS "Allow public insert/update artists" ON dale_play_artists_cache;
CREATE POLICY "Allow public insert/update artists" ON dale_play_artists_cache
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public insert/update tracks" ON dale_play_tracks_cache;
CREATE POLICY "Allow public insert/update tracks" ON dale_play_tracks_cache
  FOR ALL USING (true) WITH CHECK (true);

-- También permitir DELETE para limpiar cache expirado
DROP POLICY IF EXISTS "Allow public delete artists" ON dale_play_artists_cache;
CREATE POLICY "Allow public delete artists" ON dale_play_artists_cache
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public delete tracks" ON dale_play_tracks_cache;
CREATE POLICY "Allow public delete tracks" ON dale_play_tracks_cache
  FOR DELETE USING (true);
```

✅ **Success. No rows returned** = Permisos configurados correctamente

---

## Paso 3: Verificar que todo funciona

Ejecuta estas queries para verificar:

```sql
-- Ver estado del cache de tracks
SELECT 
  COUNT(*) as total_tracks,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as tracks_validos,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as tracks_expirados,
  MIN(cached_at) as cache_mas_antiguo,
  MAX(cached_at) as cache_mas_reciente
FROM dale_play_tracks_cache;

-- Ver tracks por artista (si hay cache)
SELECT artist_name, COUNT(*) as tracks
FROM dale_play_tracks_cache
WHERE expires_at > NOW()
GROUP BY artist_name
ORDER BY tracks DESC
LIMIT 10;
```

**Resultados esperados:**
- Si es la primera vez: `total_tracks = 0` ✅ (Normal, se llenará al generar la primera playlist)
- Si ya generaste playlists: `total_tracks > 0` y `tracks_validos > 0` ✅

---

## Paso 4: Limpiar cache manualmente (opcional)

Si quieres forzar una actualización del cache, ejecuta:

```sql
-- Limpiar TODO el cache
DELETE FROM dale_play_tracks_cache;
DELETE FROM dale_play_artists_cache;
```

La próxima generación de playlist volverá a llenar el cache automáticamente.

---

## Paso 5: Monitoreo del cache

### Ver detalles de tracks cacheados
```sql
SELECT 
  track_name,
  artist_name,
  album_name,
  cached_at,
  expires_at,
  (expires_at > NOW()) as es_valido
FROM dale_play_tracks_cache
ORDER BY cached_at DESC
LIMIT 20;
```

### Ver artistas más populares en el cache
```sql
SELECT 
  artist_name,
  COUNT(*) as total_tracks,
  MIN(track_name) as ejemplo_track
FROM dale_play_tracks_cache
WHERE expires_at > NOW()
GROUP BY artist_name
ORDER BY total_tracks DESC;
```

### Ver cuando expira el cache
```sql
SELECT 
  MIN(expires_at) as primera_expiracion,
  MAX(expires_at) as ultima_expiracion,
  MIN(expires_at) - NOW() as tiempo_hasta_expiracion
FROM dale_play_tracks_cache
WHERE expires_at > NOW();
```

---

## Troubleshooting

### ❌ Error: "relation 'dale_play_tracks_cache' does not exist"
**Solución:** Ejecuta el Paso 1

### ❌ Error: "permission denied for table dale_play_tracks_cache"
**Solución:** Ejecuta el Paso 2 (RLS policies)

### ❌ El cache siempre está vacío
**Posibles causas:**
1. No has generado ninguna playlist todavía → Genera una playlist desde la app
2. El cache expiró → Normal, se actualiza cada 24h
3. Error en la búsqueda de Spotify → Revisa los logs en Vercel

### ❌ Error al buscar tracks de Spotify
**Verifica:**
```sql
-- Asegúrate de que la tabla users existe y tiene tu email
SELECT * FROM users WHERE email = 'tu-email@ejemplo.com';
```

---

## Resumen

**Tablas necesarias:**
- ✅ `dale_play_artists_cache`
- ✅ `dale_play_tracks_cache`

**Variables de entorno:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Flujo:**
1. Primera generación → Busca en Spotify (9 requests) → Guarda en cache
2. Siguientes generaciones → Lee cache (0 requests) → Respuesta instantánea
3. Después de 24h → Cache expira → Se actualiza automáticamente


