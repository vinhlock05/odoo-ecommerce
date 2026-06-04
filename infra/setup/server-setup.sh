#!/usr/bin/env bash
# FashionOS — First-time server provisioning
#
# Run as root on a fresh Ubuntu 22.04 / 24.04 VPS:
#   curl -sL https://raw.githubusercontent.com/vinhlock05/odoo-ecommerce/main/infra/setup/server-setup.sh | bash
#
# What this script does:
#   1. System update + essential packages
#   2. Install Docker + Docker Compose plugin
#   3. Create deploy user (fashionos) with sudo + Docker access
#   4. Configure UFW firewall (22, 80, 443)
#   5. Clone repo to /opt/fashionos
#   6. Install Certbot for SSL certificates

set -euo pipefail

DEPLOY_USER="fashionos"
REPO_URL="${REPO_URL:-https://github.com/vinhlock05/odoo-ecommerce.git}"
INSTALL_DIR="/opt/fashionos"

log()  { echo -e "\033[1;32m[setup]\033[0m $*"; }
warn() { echo -e "\033[1;33m[warn]\033[0m $*"; }
die()  { echo -e "\033[1;31m[error]\033[0m $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run as root: sudo bash server-setup.sh"

# ── 1. System update ─────────────────────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl git ufw htop unzip python3-pip

# ── 2. Docker ────────────────────────────────────────────────────────────────
log "Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
else
  log "Docker already installed: $(docker --version)"
fi

# Docker Compose plugin (v2)
if ! docker compose version &>/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
fi
log "Docker Compose: $(docker compose version)"

# ── 3. Deploy user ───────────────────────────────────────────────────────────
log "Creating deploy user: $DEPLOY_USER"
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
fi
usermod -aG sudo,docker "$DEPLOY_USER"

# SSH key — copy from root if exists, otherwise remind
DEPLOY_HOME="/home/$DEPLOY_USER"
mkdir -p "$DEPLOY_HOME/.ssh"
chmod 700 "$DEPLOY_HOME/.ssh"

if [[ -f /root/.ssh/authorized_keys ]]; then
  cp /root/.ssh/authorized_keys "$DEPLOY_HOME/.ssh/authorized_keys"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_HOME/.ssh"
  log "SSH authorized_keys copied from root."
else
  warn "No SSH keys found in /root/.ssh/authorized_keys."
  warn "Add your public key to $DEPLOY_HOME/.ssh/authorized_keys manually."
fi

# ── 4. Firewall ──────────────────────────────────────────────────────────────
log "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
log "UFW status: $(ufw status verbose | head -3)"

# ── 5. Clone repo ────────────────────────────────────────────────────────────
log "Cloning repository to $INSTALL_DIR..."
if [[ -d "$INSTALL_DIR/.git" ]]; then
  log "Repo already exists — pulling latest..."
  git -C "$INSTALL_DIR" pull origin main
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$INSTALL_DIR"

# ── 6. Certbot (SSL) ─────────────────────────────────────────────────────────
log "Installing Certbot..."
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx
fi

# ── Done ─────────────────────────────────────────────────────────────────────
cat << DONE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Server setup complete!

  Next steps (run as $DEPLOY_USER):
  1. cd $INSTALL_DIR
  2. cp .env.example .env && nano .env          # fill in real values
  3. bash infra/setup/first-deploy.sh           # start all services
  4. certbot --nginx -d yourdomain.com          # get SSL cert

  GitHub Actions deploy (configure these secrets):
    SERVER_HOST      = $(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    SERVER_USER      = $DEPLOY_USER
    SSH_PRIVATE_KEY  = (content of ~/.ssh/id_rsa on your machine)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DONE
