const authService = require("../services/authService");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = new Error("Email e senha são obrigatórios.");
      err.statusCode = 400;
      return next(err);
    }
    const result = await authService.login(email, password);
    return res.json(result);
  } catch (err) {
    err.statusCode = 401;
    return next(err);
  }
}

module.exports = { login };
