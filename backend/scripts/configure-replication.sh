#!/bin/bash
# Script para configurar pg_hba.conf después de la inicialización

# Agregar entrada para replicación si no existe
if ! grep -q "replicator" /var/lib/postgresql/data/pg_hba.conf; then
  echo "# Replication" >> /var/lib/postgresql/data/pg_hba.conf
  echo "host    replication     replicator      0.0.0.0/0               md5" >> /var/lib/postgresql/data/pg_hba.conf
  echo "host    all             all             0.0.0.0/0               md5" >> /var/lib/postgresql/data/pg_hba.conf
fi

# Recargar configuración
pg_ctl reload -D /var/lib/postgresql/data || true
