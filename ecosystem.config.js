/**
 * PM2 Ecosystem — Portal de Empregabilidade SENAI
 *
 * Uso:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production   # zero-downtime
 *   pm2 stop  empregabilidade-api
 *   pm2 logs  empregabilidade-api
 */

module.exports = {
  apps: [
    {
      name: "empregabilidade-api",
      script: "./server.js",

      // Cluster mode — distribui requisições entre N processos Node.js
      // 2 instâncias é um bom ponto de partida para um VPS com 2 vCPUs.
      // Use "max" para preencher todos os núcleos disponíveis.
      instances:  2,
      exec_mode:  "cluster",

      // Reiniciar automaticamente se o processo consumir mais de 512 MB
      max_memory_restart: "512M",

      // Não reiniciar indefinidamente em caso de crash em loop
      max_restarts:    10,
      min_uptime:      "10s",
      restart_delay:   3000,

      // Variáveis de ambiente
      env_production: {
        NODE_ENV: "production",
        PORT:     3001,
      },

      // Logs
      error_file:      "/var/log/pm2/empregabilidade-error.log",
      out_file:        "/var/log/pm2/empregabilidade-out.log",
      merge_logs:      true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Rotação automática de logs (requer pm2-logrotate)
      // Instalar: pm2 install pm2-logrotate
    },
  ],
};
