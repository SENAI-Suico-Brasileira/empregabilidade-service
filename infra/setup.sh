#!/bin/bash
##
## setup.sh — Provisionamento inicial do EC2 (Ubuntu 22.04 LTS)
##
## Execução única na primeira vez:
##   chmod +x setup.sh && sudo ./setup.sh
##
## O que faz:
##   1. Instala Node.js 20, MySQL 8, Nginx
##   2. Cria banco e usuário MySQL (acesso apenas local)
##   3. Cria estrutura de diretórios em /var/www
##   4. Registra e inicia o serviço systemd do Node.js
##   5. Configura o Nginx como proxy reverso
##

set -e  # para imediatamente se qualquer comando falhar

##─────────────────────────────────────────────────────────────────
## Configurações — edite antes de rodar
##─────────────────────────────────────────────────────────────────
DB_NAME="empregabilidade"
DB_USER="empregabilidade"
DB_PASS="TROQUE_ESTA_SENHA_FORTE_AQUI"
APP_USER="ubuntu"                          # usuário do sistema que roda o Node.js
##─────────────────────────────────────────────────────────────────

echo "==> [1/5] Atualizando pacotes..."
apt-get update -y && apt-get upgrade -y

echo "==> [2/5] Instalando Node.js 20, MySQL 8, Nginx..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs mysql-server nginx

echo "==> [3/5] Configurando MySQL (acesso apenas local)..."
# Garante que o MySQL só escuta em localhost
sed -i 's/^bind-address\s*=.*/bind-address = 127.0.0.1/' /etc/mysql/mysql.conf.d/mysqld.cnf
systemctl restart mysql

mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "==> [4/5] Criando diretórios da aplicação..."
mkdir -p /var/www/empregabilidade-service
mkdir -p /var/www/empregabilidade-web/dist
chown -R ${APP_USER}:${APP_USER} /var/www/empregabilidade-service
chown -R ${APP_USER}:${APP_USER} /var/www/empregabilidade-web

echo "==> [5/5] Configurando Nginx..."
cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/empregabilidade
ln -sf /etc/nginx/sites-available/empregabilidade /etc/nginx/sites-enabled/empregabilidade
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable nginx && systemctl restart nginx

echo ""
echo "✔ Provisionamento concluído."
echo ""
echo "Próximos passos:"
echo "  1. Envie o código: veja deploy.sh"
echo "  2. Crie /var/www/empregabilidade-service/.env com as credenciais reais"
echo "     DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
echo "  3. Instale o serviço systemd:"
echo "     sudo cp infra/empregabilidade.service /etc/systemd/system/"
echo "     sudo systemctl daemon-reload && sudo systemctl enable empregabilidade && sudo systemctl start empregabilidade"
