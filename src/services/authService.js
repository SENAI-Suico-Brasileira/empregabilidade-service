const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: { select: { id: true, name: true } } },
  });

  if (!user) throw new Error("Credenciais inválidas.");

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw new Error("Credenciais inválidas.");

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    // companyId é necessário no frontend para o painel da empresa
    ...(user.company ? { companyId: user.company.id } : {}),
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "8h" });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company ?? null,
    },
  };
}

module.exports = { login };
