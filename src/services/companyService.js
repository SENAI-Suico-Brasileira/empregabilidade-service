const prisma = require("../lib/prisma");

// Status que a empresa pode definir (não inclui ACTIVE/REJECTED — esses são do admin)
const COMPANY_ALLOWED_STATUSES = ["INACTIVE", "IN_PROGRESS", "COMPLETED"];

// COMPLETED é terminal — a empresa não pode sair desse status
const TERMINAL_STATUSES = ["COMPLETED"];

// ─── Perfil da empresa ────────────────────────────────────────────────────

async function getProfile(userId) {
  const company = await prisma.company.findUnique({
    where: { userId: Number(userId) },
  });
  if (!company) throw new Error("Perfil de empresa não encontrado.");
  return company;
}

async function updateProfile(userId, { name, description }) {
  const company = await prisma.company.findUnique({ where: { userId: Number(userId) } });
  if (!company) throw new Error("Empresa não encontrada.");

  return prisma.company.update({
    where: { id: company.id },
    data: { name, description },
  });
}

// ─── Vagas da empresa ─────────────────────────────────────────────────────

async function listOwnJobs(userId) {
  const company = await prisma.company.findUnique({ where: { userId: Number(userId) } });
  if (!company) throw new Error("Empresa não encontrada.");

  return prisma.job.findMany({
    where: { companyId: company.id },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Retorna vagas preenchidas (COMPLETED) da empresa para uso como template.
 * Alinha com o fluxo: "você já preencheu uma vaga parecida, quer usar como base?"
 */
async function listCompletedTemplates(userId) {
  const company = await prisma.company.findUnique({ where: { userId: Number(userId) } });
  if (!company) throw new Error("Empresa não encontrada.");

  return prisma.job.findMany({
    where: { companyId: company.id, status: "COMPLETED" },
    select: {
      id: true,
      title: true,
      contractType: true,
      workLocation: true,
      workSchedule: true,
      responsibilities: true,
      requiredQualifications: true,
      desiredQualifications: true,
      benefits: true,
      salaryType: true,
      salaryMin: true,
      salaryMax: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
}

async function createJob(userId, data) {
  const company = await prisma.company.findUnique({ where: { userId: Number(userId) } });
  if (!company) throw new Error("Empresa não encontrada.");

  return prisma.job.create({
    data: {
      ...data,
      companyId: company.id,
      categoryId: Number(data.categoryId),
      contractType: data.contractType || "OTHER",
      status: "PENDING",
      applicationDeadline: data.applicationDeadline
        ? new Date(data.applicationDeadline)
        : null,
    },
    include: { category: true, company: { select: { name: true } } },
  });
}

/**
 * Atualiza o status de uma vaga respeitando as regras de negócio:
 * - Empresa só pode usar: INACTIVE, IN_PROGRESS, COMPLETED
 * - COMPLETED é terminal — não pode ser alterado após definido
 * - COMPLETED exige filledBy (obrigatório: SENAI_STUDENT ou OTHER)
 * - INACTIVE exige pauseReason (obrigatório)
 */
async function updateJobStatus(jobId, userId, { status, filledBy, pauseReason }) {
  if (!COMPANY_ALLOWED_STATUSES.includes(status)) {
    const err = new Error(`Status inválido. Permitidos: ${COMPANY_ALLOWED_STATUSES.join(", ")}.`);
    err.statusCode = 400;
    throw err;
  }

  const company = await prisma.company.findUnique({ where: { userId: Number(userId) } });
  const job = await prisma.job.findFirst({
    where: { id: Number(jobId), companyId: company?.id },
  });

  if (!job) {
    const err = new Error("Vaga não encontrada ou sem permissão.");
    err.statusCode = 404;
    throw err;
  }

  if (TERMINAL_STATUSES.includes(job.status)) {
    const err = new Error("Vaga preenchida não pode ter o status alterado.");
    err.statusCode = 400;
    throw err;
  }

  if (status === "COMPLETED" && !filledBy) {
    const err = new Error("Informe se a vaga foi preenchida por aluno do SENAI ou outro candidato.");
    err.statusCode = 400;
    throw err;
  }

  if (status === "INACTIVE" && !pauseReason?.trim()) {
    const err = new Error("Informe o motivo da pausa.");
    err.statusCode = 400;
    throw err;
  }

  return prisma.job.update({
    where: { id: Number(jobId) },
    data: {
      status,
      filledBy: status === "COMPLETED" ? filledBy : undefined,
      pauseReason: status === "INACTIVE" ? pauseReason : undefined,
    },
  });
}

module.exports = {
  getProfile,
  updateProfile,
  listOwnJobs,
  listCompletedTemplates,
  createJob,
  updateJobStatus,
};
