#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Deploy / atualização do Portal de Empregabilidade SENAI
#
# Execução (no servidor, como root ou usuário com sudo):
#   bash /opt/empregabilidade/deploy/deploy.sh
#
# O que este script faz em cada execução:
#   1. Pull das últimas alterações do repositório
#   2. Build do frontend (Vite) e copia para o diretório do NGINX
#   3. Instala dependências de produção do backend
#   4. Aplica alterações de schema no banco (Prisma db push)
#   5. Reinicia a aplicação via PM2 (zero-downtime reload)
#   6. Salva o estado do PM2 (persiste entre reinicializações)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Variáveis ─────────────────────────────────────────────────────────────────
REPO_DIR="/opt/empregabilidade"
SERVICE_DIR="$REPO_DIR/empregabilidade-service"
WEB_SRC="$REPO_DIR/empregabilidade-web"
WEB_DIST="$WEB_SRC/dist"
WEB_DEST="/var/www/empregabilidade/web"

# ── Helpers ───────────────────────────────────────────────────────────────────
info()    { echo -e "\n\033[1;34m[$(date '+%H:%M:%S')]\033[0m $*"; }
success() { echo -e "\033[1;32m[OK]\033[0m $*"; }
die()     { echo -e "\033[1;31m[ERRO]\033[0m $*" >&2; exit 1; }

[[ -d "$REPO_DIR/.git" ]] || die "Repositório não encontrado em $REPO_DIR. Execute setup.sh primeiro."
[[ -f "$SERVICE_DIR/.env" ]] || die ".env não encontrado em $SERVICE_DIR. Crie-o a partir do .env.example."

# ── 1. Atualiza repositório ───────────────────────────────────────────────────
info "Buscando atualizações do repositório..."
git -C "$REPO_DIR" fetch origin
git -C "$REPO_DIR" pull --ff-only
success "Repositório atualizado"

# ── 2. Build do frontend ──────────────────────────────────────────────────────
info "Instalando dependências do frontend..."
npm ci --prefix "$WEB_SRC" --silent

info "Gerando build de produção (Vite)..."
npm run build --prefix "$WEB_SRC"

info "Publicando build no NGINX ($WEB_DEST)..."
mkdir -p "$WEB_DEST"
# rsync com --delete remove arquivos antigos (hashes velhos do Vite)
rsync -a --delete "$WEB_DIST/" "$WEB_DEST/"
success "Frontend publicado"

# ── 3. Dependências do backend ────────────────────────────────────────────────
info "Instalando dependências de produção do backend..."
npm ci --prefix "$SERVICE_DIR" --omit=dev --silent
success "Dependências instaladas"

# ── 4. Prisma — gera client e sincroniza schema ───────────────────────────────
info "Gerando Prisma Client..."
npx --prefix "$SERVICE_DIR" prisma generate

info "Sincronizando schema com o banco (prisma db push)..."
# db push aplica alterações não-destrutivas sem criar arquivos de migration.
# Para migrações com histórico de versão, use:
#   npx prisma migrate deploy
npx --prefix "$SERVICE_DIR" prisma db push --skip-generate
success "Schema sincronizado"

# ── 5. PM2 — inicia ou recarrega a aplicação ─────────────────────────────────
info "Iniciando/recarregando aplicação via PM2..."
ECOSYSTEM="$SERVICE_DIR/ecosystem.config.js"

if pm2 list | grep -q "empregabilidade-api"; then
    # Já está rodando — reload sem downtime (cluster mode)
    pm2 reload "$ECOSYSTEM" --env production
else
    # Primeira execução
    pm2 start "$ECOSYSTEM" --env production
fi

# Persiste a lista de processos para sobreviver a reinicializações do servidor
pm2 save
success "PM2 atualizado"

# ── 6. Resumo ─────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " Deploy concluído!"
echo "═══════════════════════════════════════════════════════════════"
pm2 list
echo ""
echo " Logs em tempo real:  pm2 logs empregabilidade-api"
echo " Status:              pm2 status"
echo " Monitoramento:       pm2 monit"
echo "═══════════════════════════════════════════════════════════════"
