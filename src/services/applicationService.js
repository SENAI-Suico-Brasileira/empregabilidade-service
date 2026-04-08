const prisma = require("../lib/prisma");

/**
 * Verifica se já existe um candidato com o CPF informado.
 * Retorna apenas os dados necessários para pré-preencher o formulário.
 */
async function findApplicantByCpf(cpf) {
  const clean = cleanCpf(cpf);
  const applicant = await prisma.applicant.findUnique({
    where: { cpf: clean },
    select: {
      id: true,
      name: true,
      birthDate: true,
      modality: true,
      className: true,
      classYear: true,
    },
  });
  return applicant; // null se não encontrado
}

/**
 * Registra uma candidatura para uma vaga.
 * Fluxo:
 *  1. Se já existe candidato com esse CPF → reutiliza o perfil
 *  2. Caso contrário → cria o candidato
 *  3. Verifica se já candidatou-se a esta vaga (evita duplicata)
 *  4. Cria a Application
 *  5. Retorna os dados de contato da vaga (revelados após candidatura)
 */
async function apply(jobId, applicantData) {
  const {
    cpf,
    name,
    birthDate,
    modality,
    className,
    classYear,
    lgpdConsent,
  } = applicantData;

  if (!lgpdConsent) {
    const err = new Error("É necessário aceitar os termos da LGPD para se candidatar.");
    err.statusCode = 400;
    throw err;
  }

  // Verifica se a vaga existe e está ativa
  const job = await prisma.job.findFirst({
    where: { id: Number(jobId), status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      contactEmail: true,
      contactPhone: true,
      contactLink: true,
      applicationLink: true,
    },
  });
  if (!job) {
    const err = new Error("Vaga não encontrada ou não está disponível.");
    err.statusCode = 404;
    throw err;
  }

  const clean = cleanCpf(cpf);

  // Upsert do candidato pelo CPF
  const applicant = await prisma.applicant.upsert({
    where: { cpf: clean },
    update: {
      name,
      birthDate: new Date(birthDate),
      modality,
      className: className || null,
      classYear: classYear ? Number(classYear) : null,
      lgpdConsent: true,
    },
    create: {
      cpf: clean,
      name,
      birthDate: new Date(birthDate),
      modality,
      className: className || null,
      classYear: classYear ? Number(classYear) : null,
      lgpdConsent: true,
    },
  });

  // Verifica duplicata
  const existing = await prisma.application.findUnique({
    where: { applicantId_jobId: { applicantId: applicant.id, jobId: Number(jobId) } },
  });
  if (existing) {
    const err = new Error("Você já se candidatou a esta vaga.");
    err.statusCode = 409;
    throw err;
  }

  await prisma.application.create({
    data: { applicantId: applicant.id, jobId: Number(jobId) },
  });

  // Retorna os dados de contato — revelados apenas após candidatura bem-sucedida
  return {
    contactEmail: job.contactEmail,
    contactPhone: job.contactPhone,
    contactLink:  job.contactLink,
    applicationLink: job.applicationLink,
  };
}

/**
 * Lista os candidatos de uma vaga.
 * Acessível por: empresa dona da vaga e admins.
 */
async function listApplicants(jobId) {
  return prisma.application.findMany({
    where: { jobId: Number(jobId) },
    include: {
      applicant: {
        select: {
          id: true,
          name: true,
          cpf: true,
          birthDate: true,
          modality: true,
          className: true,
          classYear: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Remove pontos e traço do CPF, mantendo apenas os 11 dígitos. */
function cleanCpf(cpf) {
  return String(cpf).replace(/\D/g, "");
}

module.exports = { findApplicantByCpf, apply, listApplicants };
