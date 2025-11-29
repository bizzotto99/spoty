-- Primero, obtener el ID del label_record "Dale Play Records"
-- Ejecuta esto para ver el UUID:
SELECT id, texto 
FROM label_records 
WHERE texto = 'Dale Play Records';

-- Luego usa ese UUID en el INSERT, o usa esta query que lo obtiene automáticamente:

-- Opción 1: Insertar usuario CON label_record (si existe "Dale Play Records")
INSERT INTO users (email, spotify_user_id, label_record_id)
VALUES (
  'ninobizzotto14@gmail.com',
  '6aw4cpbsq9ksz37hnadro1cts',
  (SELECT id FROM label_records WHERE texto = 'Dale Play Records' LIMIT 1)
);

-- Opción 2: Insertar usuario SIN label_record (dejando label_record_id como NULL)
INSERT INTO users (email, spotify_user_id, label_record_id)
VALUES (
  'ninobizzotto14@gmail.com',
  '6aw4cpbsq9ksz37hnadro1cts',
  NULL
);

