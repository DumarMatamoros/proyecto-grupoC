-- Script de inicialización para la base de datos primaria
-- Crear usuario de replicación
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replicator123';

-- Permisos de replicación
ALTER ROLE replicator CREATEDB CREATEROLE;

-- Slot de replicación
SELECT * FROM pg_create_physical_replication_slot('replica_slot');
