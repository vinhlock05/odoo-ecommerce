#!/usr/bin/env bash
# FashionOS PostgreSQL restore
# Usage: bash infra/backup/restore.sh backups/fashionos_daily_20260604_020000.sql.gz
#
# WARNING: This will DROP and recreate the database. Back up first!

set -euo pipefail

BACKUP_FILE="${1:-}"
if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Available backups:"
  ls -lh "$(dirname "$0")/../../backups/"*.sql.gz 2>/dev/null || echo "  (none)"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "ERROR: File not found: $BACKUP_FILE"
  exit 1
fi

DB_USER="${DB_USER:-odoo}"
DB_NAME="${DB_NAME:-fashionos}"
DB_PASSWORD="${DB_PASSWORD:-}"

DB_CONTAINER=$(docker ps --filter "name=db" --filter "ancestor=postgres" --format "{{.Names}}" | head -1)
if [[ -z "$DB_CONTAINER" ]]; then
  echo "ERROR: No running postgres container found."
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESTORE: $BACKUP_FILE"
echo "  → database: $DB_NAME on container $DB_CONTAINER"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -r -p "Type YES to continue: " CONFIRM
[[ "$CONFIRM" != "YES" ]] && echo "Aborted." && exit 0

echo "[$(date '+%H:%M:%S')] Dropping existing database…"
docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" \
  psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;" postgres

docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" \
  psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" postgres

echo "[$(date '+%H:%M:%S')] Restoring from $BACKUP_FILE…"
zcat "$BACKUP_FILE" | docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" \
  psql -U "$DB_USER" "$DB_NAME"

echo "[$(date '+%H:%M:%S')] Restore complete."
