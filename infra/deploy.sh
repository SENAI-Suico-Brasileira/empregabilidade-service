#!/bin/bash
##
## deploy.sh — Deploy do backend Node.js no EC2
##
## Executar na máquina LOCAL, após um push no GitHub:
##   chmod +x infra/deploy.sh
##   EC2_HOST=ubuntu@<IP_DO_EC2> ./infra/deploy.sh
##
## Ou SSH diretamente no EC2 e rodar via git pull (ver bloco REMOTE abaixo).
##

set -e

EC2_HOST="${EC2_HOST:-ubuntu@SEU_IP_EC2_AQUI}"
REMOTE_DIR="/var/www/empregabilidade-service"

echo "==> Deploy do backend em ${EC2_HOST}..."

ssh "${EC2_HOST}" bash <<'REMOTE'
  set -e
  cd /var/www/empregabilidade-service

  echo "→ Atualizando código..."
  git pull origin main

  echo "→ Instalando dependências de produção..."
  npm ci --omit=dev

  echo "→ Gerando client Prisma..."
  npx prisma generate

  echo "→ Aplicando migrações no banco..."
  npx prisma db push

  echo "→ Reiniciando serviço..."
  sudo systemctl restart empregabilidade

  echo "✔ Backend atualizado e rodando."
REMOTE
