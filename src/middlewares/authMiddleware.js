const jwt = require("jsonwebtoken");

/**
 * Valida o JWT e popula req.user.
 * Deve ser usado antes de requireRole().
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token não fornecido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido ou expirado." });
  }
}

/**
 * Fábrica de middleware de autorização por role.
 * Uso: router.post("/", authMiddleware, requireRole("ADMIN"), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Acesso negado." });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
