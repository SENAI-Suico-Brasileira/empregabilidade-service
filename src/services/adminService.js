const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");

// ─── Indicadores do painel ────────────────────────────────────────────────

async function getIndicators() {
  const [
    totalCompanies,
    companiesWithActiveJobs,
    jobsByStatus,
    jobsByContractType,
    jobsByCategory,
    filledBySenai,
    filledByOther,
  ] = await Promise.all([
    // Total de empresas cadastradas
    prisma.company.count(),

    // Empresas com pelo menos 1 vaga ativa
    prisma.company.count({
      where: { jobs: { some: { status: "ACTIVE" } } },
    }),

    // Contagem por status
    prisma.job.groupBy({ by: ["status"], _count: { id: true } }),

    // Contagem por tipo de contrato (apenas vagas ativas)
    prisma.job.groupBy({
      by: ["contractType"],
      where: { status: { in: ["ACTIVE", "IN_PROGRESS"] } },
      _count: { id: true },
    }),

    // Contagem por categoria (vagas ativas)
    prisma.job.groupBy({
      by: ["categoryId"],
      where: { status: "ACTIVE" },
      _count: { id: true },
    }),

    // Vagas preenchidas por aluno SENAI
    prisma.job.count({
      where: { status: "COMPLETED", filledBy: "SENAI_STUDENT" },
    }),

    // Vagas preenchidas por outros candidatos
    prisma.job.count({
      where: { status: "COMPLETED", filledBy: "OTHER" },
    }),
  ]);

  // Enriquece jobsByCategory com o nome da categoria
  const categoryIds = jobsByCategory.map((j) => j.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, slug: true },
  });
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return {
    totalCompanies,
    companiesWithActiveJobs,
    jobsByStatus: Object.fromEntries(
      jobsByStatus.map((s) => [s.status, s._count.id])
    ),
    jobsByContractType: Object.fromEntries(
      jobsByContractType.map((c) => [c.contractType, c._count.id])
    ),
    jobsByCategory: jobsByCategory.map((j) => ({
      categoryName: categoryMap[j.categoryId]?.name ?? "Sem categoria",
      categorySlug: categoryMap[j.categoryId]?.slug ?? null,
      count: j._count.id,
    })),
    filledBySenai,
    filledByOther,
  };
}

// ─── Gestão de vagas ──────────────────────────────────────────────────────

async function listAllJobs({ status } = {}) {
  return prisma.job.findMany({
    where: status ? { status } : undefined,
    include: {
      company:  { select: { id: true, name: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function approveJob(id) {
  return prisma.job.update({
    where: { id: Number(id) },
    data: { status: "ACTIVE", rejectionReason: null },
  });
}

async function rejectJob(id, reason) {
  return prisma.job.update({
    where: { id: Number(id) },
    data: { status: "REJECTED", rejectionReason: reason ?? null },
  });
}

// ─── Gestão de empresas ───────────────────────────────────────────────────

async function listCompanies() {
  return prisma.company.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { jobs: true } },
    },
    orderBy: { name: "asc" },
  });
}

async function getCompany(id) {
  const company = await prisma.company.findUnique({
    where: { id: Number(id) },
    include: {
      user: { select: { id: true, name: true, email: true } },
      jobs: {
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!company) throw new Error("Empresa não encontrada.");
  return company;
}

/**
 * Cria conta de usuário + perfil de empresa em uma transação.
 * O admin é quem cadastra as empresas na plataforma.
 */
async function createCompany({ name, cnpj, description, contact, userName, userEmail, userPassword }) {
  const hashedPassword = await bcrypt.hash(userPassword, 10);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name: userName, email: userEmail, password: hashedPassword, role: "COMPANY" },
    });
    const company = await tx.company.create({
      data: { name, cnpj, description, contact, userId: user.id },
    });
    return { user: { id: user.id, name: user.name, email: user.email }, company };
  });
}

async function updateCompany(id, { name, cnpj, description, contact }) {
  return prisma.company.update({
    where: { id: Number(id) },
    data: { name, cnpj, description, contact },
  });
}

module.exports = {
  getIndicators,
  listAllJobs,
  approveJob,
  rejectJob,
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
};
