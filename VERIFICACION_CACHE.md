# ✅ Verificación del Sistema de Cache

## Tablas Creadas ✅

Si ya creaste las tablas en Supabase, ahora necesitas configurar los **permisos RLS (Row Level Security)**.

---

## 🔐 Paso 1: Configurar Permisos RLS

Ejecuta este SQL en tu dashboard de Supabase (SQL Editor):

```sql
-- Habilitar RLS en las tablas
ALTER TABLE dale_play_artists_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE dale_play_tracks_cache ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública
CREATE POLICY "Allow public read access artists" ON dale_play_artists_cache
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access tracks" ON dale_play_tracks_cache
  FOR SELECT USING (true);

-- Permitir inserción/actualización pública
CREATE POLICY "Allow public insert/update artists" ON dale_play_artists_cache
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public insert/update tracks" ON dale_play_tracks_cache
  FOR ALL USING (true) WITH CHECK (true);

-- Permitir DELETE para limpiar cache expirado
CREATE POLICY "Allow public delete artists" ON dale_play_artists_cache
  FOR DELETE USING (true);

CREATE POLICY "Allow public delete tracks" ON dale_play_tracks_cache
  FOR DELETE USING (true);
```

O simplemente ejecuta el archivo completo: `supabase-cache-permissions.sql`

---

## ✅ Paso 2: Verificar que Funciona

### Primera Vez (Sin Cache):

1. **Genera una playlist** en la aplicación
2. **Revisa los logs** (en Vercel o terminal):
   - Debería decir: `🔍 Buscando artistas y X tracks de Dale Play Records... [OPTIMIZADO]`
   - Luego: `✅ Cache guardado: X artistas de Dale Play en Supabase`
   - Luego: `✅ Cache guardado: X tracks de Dale Play en Supabase`

3. **Revisa Supabase**:
   - Ve a tu dashboard de Supabase
   - Tabla `dale_play_artists_cache`: Debería tener registros
   - Tabla `dale_play_tracks_cache`: Debería tener registros

### Segunda Vez (Con Cache):

1. **Genera otra playlist** (inmediatamente después)
2. **Revisa los logs**:
   - Debería decir: `✅ Cache hit: X artistas de Dale Play desde Supabase`
   - Debería decir: `✅ Cache hit: X tracks de Dale Play desde Supabase`
   - **NO debería hacer requests a Spotify** (solo 1 para audio features si hay BPM)

---

## 🔍 Troubleshooting

### Si ves errores de permisos:

```
Error: new row violates row-level security policy
```

**Solución**: Ejecuta el SQL de permisos RLS (Paso 1)

### Si no se guarda el cache:

1. Verifica que las tablas existan:
   ```sql
   SELECT * FROM dale_play_artists_cache LIMIT 1;
   SELECT * FROM dale_play_tracks_cache LIMIT 1;
   ```

2. Verifica que los permisos estén configurados:
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('dale_play_artists_cache', 'dale_play_tracks_cache');
   ```

### Si el cache no se lee:

1. Verifica que haya registros en las tablas
2. Verifica que `expires_at` sea mayor a `NOW()`
3. Revisa los logs de la aplicación para ver errores específicos

---

## 📊 Cómo Verificar en Supabase Dashboard

1. **Ve a tu proyecto en Supabase**
2. **Table Editor** → Busca las tablas:
   - `dale_play_artists_cache`
   - `dale_play_tracks_cache`
3. **Deberías ver registros** después de generar la primera playlist

---

## 🎯 Resultado Esperado

### Primera Playlist:
- ✅ Hace ~19 requests a Spotify
- ✅ Guarda en cache (Supabase)

### Playlists Siguientes (dentro de 24 horas):
- ✅ **0 requests a Spotify** (lee desde cache)
- ✅ Solo 1 request para audio features (si hay filtro BPM)
- ✅ **~97% menos requests!**

---

## ✅ Todo Listo

Si todo está configurado correctamente:
1. ✅ Tablas creadas
2. ✅ Permisos RLS configurados
3. ✅ Código actualizado

**¡El sistema de cache debería funcionar automáticamente!** 🎉

