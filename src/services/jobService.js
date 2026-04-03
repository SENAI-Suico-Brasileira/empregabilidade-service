const prisma = require("../lib/prisma");

// Campos expostos publicamente no /mural — nunca expõe dados privados da empresa
const PUBLIC_JOB_SELECT = {
  id: true,
  companyConfidential: true,
  title: true,
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

/** Lista vagas ativas para o mural público, com filtro opcional por categoria. */
async function listPublicJobs({ categoryId } = {}) {
  return prisma.job.findMany({
    where: {
      status: "ACTIVE",
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    },
    select: PUBLIC_JOB_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

async function getPublicJob(id) {
  const job = await prisma.job.findUnique({
    where: { id: Number(id) },
    select: PUBLIC_JOB_SELECT,
  });
  if (!job || job.status !== "ACTIVE") throw new Error("Vaga não encontrada.");
  return job;
}

module.exports = { listPublicJobs, getPublicJob };
