const express = require("express");
const cors = require("cors");
const routes = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");

const app = express();

// Origens permitidas: produção (hardcoded) + extras via CORS_ORIGIN
const allowedOrigins = [
  "https://empregabilidade-web.vercel.app",
  ...( process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost:5173"]
  ),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
  })
);

app.use(express.json());

// Todas as rotas da API sob o prefixo /api
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Tratamento centralizado de erros — deve ser o último middleware
app.use(errorHandler);

module.exports = app;
