const { PrismaClient } = require("@prisma/client");

// Instância única do Prisma (Singleton) para evitar múltiplas conexões
const prisma = new PrismaClient();

module.exports = prisma;
