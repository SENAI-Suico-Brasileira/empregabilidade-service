#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup.sh — Configuração inicial do servidor Debian
#
# Execução (uma única vez, como root ou com sudo):
#   chmod +x setup.sh && sudo bash setup.sh
#
# O que este script faz:
#   1. Atualiza o sistema
#   2. Instala Node.js LTS, NGINX e MariaDB
#   3. Instala PM2 globalmente e configura o serviço de inicialização
#   4. Cria o banco de dados e o usuário da aplicação
#   5. Cria a estrutura de diretórios
#   6. Ativa a configuração do NGINX
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Variáveis — ajuste antes de rodar ────────────────────────────────────────
REPO_DIR="/opt/empregabilidade"
WEB_DIR="/var/www/empregabilidade/web"
DB_NAME="empregabilidade_db"
DB_USER="empregabilidade"
DB_PASS=""          # Deixe vazio para gerar automaticamente, ou defina aqui
NODE_VERSION="22"   # LTS atual — verifique https://nodejs.org/en/about/previous-releases

# ── Helpers ───────────────────────────────────────────────────────────────────
info()    { echo -e "\n\033[1;34m[INFO]\033[0m $*"; }
success() { echo -e "\033[1;32m[OK]\033[0m $*"; }
warn()    { echo -e "\033[1;33m[AVISO]\033[0m $*"; }
die()     { echo -e "\033[1;31m[ERRO]\033[0m $*" >&2; exit 1; }

[[ $EUID -ne 0 ]] && die "Execute como root: sudo bash setup.sh"

# ── 1. Sistema ────────────────────────────────────────────────────────────────
info "Atualizando pacotes do sistema..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git rsync unzip lsb-release ca-certificates gnupg

# ── 2. Node.js ────────────────────────────────────────────────────────────────
info "Instalando Node.js $NODE_VERSION LTS..."
if ! command -v node &>/dev/null; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
    apt-get install -y nodejs
fi
node_ver=$(node -v)
npm_ver=$(npm -v)
success "Node $node_ver / npm $npm_ver instalados"

# ── 3. PM2 ────────────────────────────────────────────────────────────────────
info "Instalando PM2..."
npm install -g pm2 --silent

# Configura PM2 para iniciar automaticamente no boot (como root, depois troca para o usuário da app)
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
success "PM2 instalado e configurado no systemd"

# ── 4. NGINX ──────────────────────────────────────────────────────────────────
info "Instalando NGINX..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
success "NGINX instalado"

# ── 5. MariaDB ────────────────────────────────────────────────────────────────
info "Instalando MariaDB..."
apt-get install -y mariadb-server mariadb-client
systemctl enable mariadb
systemctl start mariadb

# Gera senha aleatória se não foi definida
if [[ -z "$DB_PASS" ]]; then
    DB_PASS=$(openssl rand -base64 24 | tr -d '/+=')
    warn "Senha do banco gerada automaticamente — guarde-a agora:"
    echo ""
    echo "  DB_USER: $DB_USER"
    echo "  DB_PASS: $DB_PASS"
    echo "  DB_NAME: $DB_NAME"
    echo ""
fi

info "Criando banco de dados e usuário da aplicação..."
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME}
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost'
  IDENTIFIED BY '${DB_PASS}';

GRANT ALL PRIVILEGES
  ON ${DB_NAME}.*
  TO '${DB_USER}'@'localhost';

FLUSH PRIVILEGES;
SQL
success "Banco '$DB_NAME' e usuário '$DB_USER' criados"

# ── 6. Diretórios ─────────────────────────────────────────────────────────────
info "Criando estrutura de diretórios..."
mkdir -p "$WEB_DIR"
mkdir -p /var/log/pm2

# Se o repositório ainda não foi clonado, instrui o operador
if [[ ! -d "$REPO_DIR/.git" ]]; then
    warn "Repositório não encontrado em $REPO_DIR"
    warn "Clone o repositório manualmente:"
    warn "  git clone https://github.com/SEU_USUARIO/empregabilidade.git $REPO_DIR"
fi

# ── 7. NGINX — ativa a configuração da aplicação ──────────────────────────────
NGINX_CONF="$REPO_DIR/deploy/nginx.conf"
NGINX_SITE="/etc/nginx/sites-available/empregabilidade"
NGINX_LINK="/etc/nginx/sites-enabled/empregabilidade"

if [[ -f "$NGINX_CONF" ]]; then
    info "Ativando configuração do NGINX..."
    cp "$NGINX_CONF" "$NGINX_SITE"

    # Remove o site padrão se existir
    rm -f /etc/nginx/sites-enabled/default

    ln -sf "$NGINX_SITE" "$NGINX_LINK"
    nginx -t && systemctl reload nginx
    success "NGINX configurado"
else
    warn "nginx.conf não encontrado em $NGINX_CONF"
    warn "Clone o repositório primeiro e execute: bash $0"
fi

# ── 8. .env de produção ───────────────────────────────────────────────────────
ENV_FILE="$REPO_DIR/empregabilidade-service/.env"
ENV_EXAMPLE="$REPO_DIR/empregabilidade-service/.env.example"

if [[ -f "$ENV_EXAMPLE" && ! -f "$ENV_FILE" ]]; then
    info "Criando .env de produção a partir do .env.example..."
    cp "$ENV_EXAMPLE" "$ENV_FILE"

    # Substitui os valores padrão pelos gerados
    sed -i "s|mysql://.*|mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}|" "$ENV_FILE"

    JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=')
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$ENV_FILE"

    warn "ATENÇÃO: Edite $ENV_FILE e defina CORS_ORIGIN com o domínio ou IP público:"
    warn "  CORS_ORIGIN=https://seu-dominio.com"
fi

# ── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " Servidor configurado!"
echo "═══════════════════════════════════════════════════════════════"
echo " Próximos passos:"
echo ""
echo "  1. Clone o repositório (se ainda não fez):"
echo "       git clone <URL> $REPO_DIR"
echo ""
echo "  2. Edite as variáveis de produção:"
echo "       nano $REPO_DIR/empregabilidade-service/.env"
echo ""
echo "  3. Execute o deploy inicial:"
echo "       bash $REPO_DIR/deploy/deploy.sh"
echo ""
echo " DB_USER : $DB_USER"
echo " DB_NAME : $DB_NAME"
echo " DB_PASS : $DB_PASS  ← Anote agora!"
echo "═══════════════════════════════════════════════════════════════"
