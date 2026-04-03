const express = require("express");
const cors = require("cors");
const routes = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");

const app = express();

// Middlewares globais
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Todas as rotas da API sob o prefixo /api
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Tratamento centralizado de erros — deve ser o último middleware
app.use(errorHandler);

module.exports = app;
