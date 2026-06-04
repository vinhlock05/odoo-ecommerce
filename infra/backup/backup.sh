#!/usr/bin/env bash
# FashionOS PostgreSQL backup
#
# Run manually:   bash infra/backup/backup.sh
# Cron (daily 2am): 0 2 * * * /opt/fashionos/infra/backup/backup.sh >> /var/log/fashionos-backup.log 2>&1
#
# Required env vars (set in .env or export before running):
#   DB_USER      — Postgres user (default: odoo)
#   DB_NAME      — Postgres database (default: fashionos)
#   DB_PASSWORD  — Postgres password
#
# Optional:
#   BACKUP_KEEP_DAILY   — daily backups to keep (default: 7)
#   BACKUP_KEEP_WEEKLY  — weekly backups to keep (default: 4)
#   RCLONE_REMOTE       — rclone remote:bucket for off-site copy (e.g. r2:fashionos-backups)
#                         leave unset to skip upload

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"

DB_USER="${DB_USER:-odoo}"
DB_NAME="${DB_NAME:-fashionos}"
DB_PASSWORD="${DB_PASSWORD:-}"
KEEP_DAILY="${BACKUP_KEEP_DAILY:-7}"
KEEP_WEEKLY="${BACKUP_KEEP_WEEKLY:-4}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"

DATE=$(date +%Y%m%d_%H%M%S)
DOW=$(date +%u)   # 1=Mon … 7=Sun
PREFIX="fashionos"
DAILY_FILE="${PREFIX}_daily_${DATE}.sql.gz"
WEEKLY_FILE="${PREFIX}_weekly_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ── Find the running db container ──────────────────────────────────────────
DB_CONTAINER=$(docker ps --filter "name=db" --filter "ancestor=postgres" --format "{{.Names}}" | head -1)
if [[ -z "$DB_CONTAINER" ]]; then
  log "ERROR: No running postgres container found. Is docker-compose up?"
  exit 1
fi

log "Backing up $DB_NAME from container $DB_CONTAINER…"

# ── pg_dump ─────────────────────────────────────────────────────────────────
PGPASSWORD="$DB_PASSWORD" docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" \
  pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$DAILY_FILE"

SIZE=$(du -h "$BACKUP_DIR/$DAILY_FILE" | cut -f1)
log "Created daily backup: $DAILY_FILE ($SIZE)"

# ── Weekly copy (every Sunday) ──────────────────────────────────────────────
if [[ "$DOW" == "7" ]]; then
  cp "$BACKUP_DIR/$DAILY_FILE" "$BACKUP_DIR/$WEEKLY_FILE"
  log "Created weekly backup: $WEEKLY_FILE"
fi

# ── Rotate daily backups ────────────────────────────────────────────────────
DAILY_COUNT=$(ls "$BACKUP_DIR"/${PREFIX}_daily_*.sql.gz 2>/dev/null | wc -l)
if (( DAILY_COUNT > KEEP_DAILY )); then
  ls -t "$BACKUP_DIR"/${PREFIX}_daily_*.sql.gz | tail -n +$((KEEP_DAILY + 1)) | xargs rm -f
  log "Rotated daily backups — kept last $KEEP_DAILY"
fi

# ── Rotate weekly backups ───────────────────────────────────────────────────
WEEKLY_COUNT=$(ls "$BACKUP_DIR"/${PREFIX}_weekly_*.sql.gz 2>/dev/null | wc -l)
if (( WEEKLY_COUNT > KEEP_WEEKLY )); then
  ls -t "$BACKUP_DIR"/${PREFIX}_weekly_*.sql.gz | tail -n +$((KEEP_WEEKLY + 1)) | xargs rm -f
  log "Rotated weekly backups — kept last $KEEP_WEEKLY"
fi

# ── Off-site upload (rclone) ────────────────────────────────────────────────
if [[ -n "$RCLONE_REMOTE" ]]; then
  if command -v rclone &>/dev/null; then
    rclone copy "$BACKUP_DIR/$DAILY_FILE" "$RCLONE_REMOTE" --progress
    log "Uploaded $DAILY_FILE to $RCLONE_REMOTE"
    [[ "$DOW" == "7" ]] && rclone copy "$BACKUP_DIR/$WEEKLY_FILE" "$RCLONE_REMOTE"
  else
    log "WARN: RCLONE_REMOTE is set but rclone is not installed — skipping upload"
  fi
fi

log "Backup complete."
