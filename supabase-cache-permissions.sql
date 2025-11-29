-- Permisos RLS (Row Level Security) para las tablas de cache
-- Ejecuta esto DESPUÉS de crear las tablas

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

