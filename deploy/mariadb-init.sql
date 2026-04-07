-- ─────────────────────────────────────────────────────────────────────────────
-- MariaDB — Inicialização do banco do Portal de Empregabilidade SENAI
--
-- Executar como root após instalar o MariaDB:
--   sudo mysql < /opt/empregabilidade/deploy/mariadb-init.sql
--
-- IMPORTANTE: Troque 'SENHA_SEGURA_AQUI' por uma senha forte antes de rodar.
-- ─────────────────────────────────────────────────────────────────────────────

-- Banco de dados principal
CREATE DATABASE IF NOT EXISTS empregabilidade_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Usuário da aplicação — acesso restrito ao banco acima e somente a localhost
CREATE USER IF NOT EXISTS 'empregabilidade'@'localhost'
  IDENTIFIED BY 'SENHA_SEGURA_AQUI';

GRANT ALL PRIVILEGES
  ON empregabilidade_db.*
  TO 'empregabilidade'@'localhost';

FLUSH PRIVILEGES;

-- Confirmação
SELECT 'Banco e usuário criados com sucesso.' AS status;
