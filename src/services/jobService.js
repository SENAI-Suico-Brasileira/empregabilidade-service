const prisma = require("../lib/prisma");

// Campos expostos publicamente no /mural — nunca expõe dados privados da empresa
const PUBLIC_JOB_SELECT = {
  id: true,
  companyConfidential: true,
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
  applicationDeadline: true,
  applicationLink: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  company: { select: { name: true, description: true } },
};

/**
 * Lista vagas ativas para o mural público.
 * Filtros opcionais: categoryId, search (busca em título e qualificações).
 */
async function listPublicJobs({ categoryId, search } = {}) {
  const searchFilter = search?.trim()
    ? {
        OR: [
          { title: { contains: search } },
          { responsibilities: { contains: search } },
          { requiredQualifications: { contains: search } },
          { desiredQualifications: { contains: search } },
          { benefits: { contains: search } },
        ],
      }
    : {};

  return prisma.job.findMany({
    where: {
      status: "ACTIVE",
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      ...searchFilter,
    },
    select: PUBLIC_JOB_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

async function getPublicJob(id) {
  const job = await prisma.job.findFirst({
    where: { id: Number(id), status: "ACTIVE" },
    select: PUBLIC_JOB_SELECT,
  });
  if (!job) throw new Error("Vaga não encontrada.");
  return job;
}

module.exports = { listPublicJobs, getPublicJob };
