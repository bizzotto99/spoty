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

-- Limpiar registros expirados automáticamente (opcional, se puede hacer manualmente)
-- CREATE OR REPLACE FUNCTION clean_expired_cache()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM dale_play_artists_cache WHERE expires_at < NOW();
--   DELETE FROM dale_play_tracks_cache WHERE expires_at < NOW();
-- END;
-- $$ LANGUAGE plpgsql;

