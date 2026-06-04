#!/usr/bin/env bash
# FashionOS — First-time deployment
# Run once on the server after server-setup.sh and filling .env
#
# Usage: bash infra/setup/first-deploy.sh

set -euo pipefail

INSTALL_DIR="/opt/fashionos"
cd "$INSTALL_DIR"

log()  { echo -e "\033[1;32m[deploy]\033[0m $*"; }
die()  { echo -e "\033[1;31m[error]\033[0m $*" >&2; exit 1; }

[[ -f .env ]] || die ".env not found. Copy .env.example and fill in real values first."

# Load env
set -a; source .env; set +a

# ── 1. Build images ───────────────────────────────────────────────────────────
log "Building Docker images (this takes 5-10 minutes on first run)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  build --no-cache

# ── 2. Start DB first ─────────────────────────────────────────────────────────
log "Starting database..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d db
sleep 10

# ── 3. Init Odoo DB ───────────────────────────────────────────────────────────
log "Initialising Odoo database (installs all modules)..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  run --rm odoo odoo \
    -d "${DB_NAME:-fashionos}" \
    --db_host=db \
    --db_user="${DB_USER:-odoo}" \
    --db_password="${DB_PASSWORD}" \
    --init=fashionos_base,fashion_store_config,fashion_store_product,\
fashion_store_sale,fashion_store_api,fashion_store_loyalty,\
payment_vnpay,delivery_ghn,fashion_store_combo,\
fashion_store_return,fashion_store_routing \
    --stop-after-init \
    --no-http \
    --logfile=/dev/stdout

# ── 4. Start all services ─────────────────────────────────────────────────────
log "Starting all services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --remove-orphans

# ── 5. Health check ───────────────────────────────────────────────────────────
log "Waiting for services to be healthy..."
for i in $(seq 1 30); do
  if docker compose exec -T odoo curl -sf http://localhost:8069/fashionos/api/v1/health; then
    log "Odoo API healthy."
    break
  fi
  sleep 5
done

# ── 6. Setup cron backup ──────────────────────────────────────────────────────
log "Setting up daily backup cron..."
CRON_JOB="0 2 * * * DB_USER=${DB_USER:-odoo} DB_NAME=${DB_NAME:-fashionos} DB_PASSWORD=${DB_PASSWORD} $INSTALL_DIR/infra/backup/backup.sh >> /var/log/fashionos-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v fashionos-backup; echo "$CRON_JOB") | crontab -
log "Backup cron set: daily at 2am."

# ── Done ──────────────────────────────────────────────────────────────────────
cat << DONE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  First deploy complete!

  Services running:
$(docker compose -f docker-compose.yml -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}")

  Next: get SSL certificate
    sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

  Set Odoo admin password:
    docker compose exec odoo odoo -d ${DB_NAME:-fashionos} \
      --login admin --password NEW_PASSWORD

  Set JWT secret in Odoo:
    Settings → Technical → Parameters → System Parameters
    Key: fashionos.jwt.secret_key
    Value: $(openssl rand -hex 32 2>/dev/null || echo "run: openssl rand -hex 32")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DONE
