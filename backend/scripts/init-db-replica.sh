#!/bin/bash
# Script de inicialización para la base de datos réplica
set -e

# Esperar a que la BD primaria esté lista
echo "Esperando a que la base de datos primaria esté disponible..."
for i in {1..30}; do
  if pg_isready -h db -p 5432 -U postgres; then
    echo "Base de datos primaria disponible"
    break
  fi
  echo "Intento $i de 30 esperando a la BD primaria..."
  sleep 2
done

# Limpiar datos existentes
echo "Preparando directorio para la replicación..."
rm -rf $PGDATA/*

# Hacer pg_basebackup de la BD primaria
echo "Haciendo backup de la BD primaria..."
pg_basebackup -h db -D $PGDATA -U replicator -v -P -W -X stream -S replica_slot

# Crear archivo de recuperación para standby
echo "standby_mode = 'on'" >> $PGDATA/recovery.conf
echo "primary_conninfo = 'host=db port=5432 user=replicator password=replicator123'" >> $PGDATA/recovery.conf
echo "primary_slot_name = 'replica_slot'" >> $PGDATA/recovery.conf

echo "Replicación configurada exitosamente"
