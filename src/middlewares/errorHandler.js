/**
 * Middleware de tratamento centralizado de erros.
 *
 * Captura erros lançados via next(err) em qualquer rota ou controller.
 * Garante uma resposta JSON padronizada e evita que stack traces
 * vazem em produção.
 *
 * Uso nos controllers: em vez de try/catch inline, basta fazer:
 *   return next(err);
 *
 * O campo `err.statusCode` é utilizado quando definido explicitamente,
 * caso contrário assume 500.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.statusCode ?? 500;
  const message = err.message || "Erro interno do servidor.";

  if (status === 500) {
    console.error("[ERROR]", err);
  }

  return res.status(status).json({ message });
}

module.exports = errorHandler;
