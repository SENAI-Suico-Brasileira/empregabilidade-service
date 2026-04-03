const prisma = require("../lib/prisma");

// Status que a empresa pode definir (não inclui ACTIVE/REJECTED — esses são do admin)
const COMPANY_ALLOWED_STATUSES = ["INACTIVE", "IN_PROGRESS", "COMPLETED"];

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

async function createJob(userId, data) {
  const company = await prisma.company.findUnique({ where: { userId: Number(userId) } });
  if (!company) throw new Error("Empresa não encontrada.");

  return prisma.job.create({
    data: {
      ...data,
      companyId: company.id,
      categoryId: Number(data.categoryId),
      status: "PENDING", // Sempre inicia aguardando aprovação do admin
      applicationDeadline: data.applicationDeadline
        ? new Date(data.applicationDeadline)
        : null,
    },
    include: { category: true, company: { select: { name: true } } },
  });
}

/**
 * Empresa pode apenas trocar o status para INACTIVE, IN_PROGRESS ou COMPLETED.
 * Aprovação/reprovação são exclusivas do admin.
 */
async function updateJobStatus(jobId, userId, status) {
  if (!COMPANY_ALLOWED_STATUSES.includes(status)) {
    throw new Error(
      `Status inválido. Permitidos: ${COMPANY_ALLOWED_STATUSES.join(", ")}.`
    );
  }

  const company = await prisma.company.findUnique({ where: { userId: Number(userId) } });
  const job = await prisma.job.findFirst({
    where: { id: Number(jobId), companyId: company?.id },
  });

  if (!job) throw new Error("Vaga não encontrada ou sem permissão.");

  return prisma.job.update({
    where: { id: Number(jobId) },
    data: { status },
  });
}

module.exports = { getProfile, updateProfile, listOwnJobs, createJob, updateJobStatus };
