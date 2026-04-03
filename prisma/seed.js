const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // ─── Categorias ────────────────────────────────────────────────────────
  const categoryData = [
    { name: "Tecnologia", slug: "tecnologia" },
    { name: "Vendas", slug: "vendas" },
    { name: "Marketing", slug: "marketing" },
    { name: "Administrativo", slug: "administrativo" },
    { name: "Industrial", slug: "industrial" },
    { name: "Logística", slug: "logistica" },
  ];

  const categories = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created.id;
  }

  // ─── Admin SENAI ────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@senai.com.br" },
    update: {},
    create: {
      name: "Analista SENAI",
      email: "admin@senai.com.br",
      password: await bcrypt.hash("senai@2025", 10),
      role: "ADMIN",
    },
  });

  // ─── Empresas de teste ──────────────────────────────────────────────────
  const companiesData = [
    {
      user: { name: "RH Tech Soluções", email: "rh@techsolucoes.com.br", password: "empresa@2025" },
      company: {
        name: "Tech Soluções LTDA",
        cnpj: "12.345.678/0001-90",
        description: "Empresa de tecnologia especializada em soluções para o varejo.",
        contact: "Maria Santos — (11) 99999-1234",
      },
    },
    {
      user: { name: "RH Comercial Alfa", email: "rh@comercialalfa.com.br", password: "empresa@2025" },
      company: {
        name: "Comercial Alfa S.A.",
        cnpj: "98.765.432/0001-10",
        description: "Rede de lojas de eletrodomésticos com 30 anos de mercado.",
        contact: "João Pereira — (11) 98888-5678",
      },
    },
    {
      user: { name: "RH Logfast", email: "rh@logfast.com.br", password: "empresa@2025" },
      company: {
        name: "Logfast Transportes",
        cnpj: "55.444.333/0001-22",
        description: "Empresa de logística e transporte com atuação nacional.",
        contact: "Ana Oliveira — (11) 97777-9012",
      },
    },
  ];

  const companyIds = {};
  for (const entry of companiesData) {
    const existing = await prisma.user.findUnique({ where: { email: entry.user.email } });
    if (!existing) {
      const created = await prisma.user.create({
        data: {
          name: entry.user.name,
          email: entry.user.email,
          password: await bcrypt.hash(entry.user.password, 10),
          role: "COMPANY",
          company: { create: entry.company },
        },
        include: { company: true },
      });
      companyIds[entry.user.email] = created.company.id;
    } else {
      const company = await prisma.company.findUnique({ where: { userId: existing.id } });
      if (company) companyIds[entry.user.email] = company.id;
    }
  }

  // ─── Vagas de exemplo (vários status para testar o fluxo completo) ──────
  const jobsData = [
    // Vagas ATIVAS — aparecem no mural
    {
      companyEmail: "rh@techsolucoes.com.br",
      categorySlug: "tecnologia",
      status: "ACTIVE",
      title: "Desenvolvedor Web Full Stack",
      workLocation: "São Paulo — SP (Híbrido)",
      workSchedule: "Seg–Sex, 09h–18h",
      responsibilities: "Desenvolver e manter aplicações web.\nParticipação em code reviews e planejamento técnico.",
      requiredQualifications: "Experiência com React e Node.js.\nConhecimento em banco de dados relacionais.",
      desiredQualifications: "Conhecimento em Docker e CI/CD.\nExperiência com metodologias ágeis.",
      benefits: "VT + VR + Plano de saúde + PLR",
      salaryType: "RANGE", salaryMin: "R$ 4.000", salaryMax: "R$ 7.000",
      applicationLink: "vagas@techsolucoes.com.br",
      lgpdConsent: true, senaiDisclaimer: true,
    },
    {
      companyEmail: "rh@techsolucoes.com.br",
      categorySlug: "tecnologia",
      status: "ACTIVE",
      companyConfidential: true,
      title: "Analista de Dados",
      workLocation: "Remoto",
      workSchedule: "Flexível",
      responsibilities: "Análise de dados e geração de relatórios gerenciais.",
      requiredQualifications: "Python ou R. Conhecimento em SQL.",
      desiredQualifications: "Power BI ou Tableau.",
      benefits: "VR + Plano de saúde",
      salaryType: "NEGOTIABLE",
      applicationLink: "https://techsolucoes.com.br/vagas",
      lgpdConsent: true, senaiDisclaimer: true,
    },
    {
      companyEmail: "rh@comercialalfa.com.br",
      categorySlug: "vendas",
      status: "ACTIVE",
      title: "Vendedor Interno",
      workLocation: "Santo André — SP",
      workSchedule: "Seg–Sáb, 09h–18h",
      responsibilities: "Atendimento ao cliente, negociação e fechamento de vendas.",
      requiredQualifications: "Ensino médio completo. Experiência em vendas.",
      benefits: "VT + VR + Comissão",
      salaryType: "FIXED", salaryMin: "R$ 2.200",
      applicationDeadline: new Date("2025-06-30"),
      applicationLink: "vagas@comercialalfa.com.br",
      lgpdConsent: true, senaiDisclaimer: true,
    },
    {
      companyEmail: "rh@logfast.com.br",
      categorySlug: "logistica",
      status: "ACTIVE",
      title: "Auxiliar de Logística",
      workLocation: "Guarulhos — SP",
      workSchedule: "Seg–Sex, 07h–16h",
      responsibilities: "Separação e expedição de mercadorias. Controle de estoque.",
      requiredQualifications: "Ensino médio completo. Disponibilidade para trabalho em galpão.",
      desiredQualifications: "Experiência com WMS ou ERP.",
      benefits: "VT + VR + Seguro de vida",
      salaryType: "FIXED", salaryMin: "R$ 1.800",
      applicationDeadline: new Date("2025-05-31"),
      applicationLink: "vagas@logfast.com.br",
      lgpdConsent: true, senaiDisclaimer: true,
    },

    // Vagas PENDENTES — aguardando aprovação do admin
    {
      companyEmail: "rh@comercialalfa.com.br",
      categorySlug: "administrativo",
      status: "PENDING",
      title: "Assistente Administrativo",
      workLocation: "São Bernardo do Campo — SP",
      workSchedule: "Seg–Sex, 08h–17h",
      responsibilities: "Suporte às áreas administrativa e financeira.",
      requiredQualifications: "Ensino médio completo. Domínio do pacote Office.",
      benefits: "VT + VR",
      salaryType: "RANGE", salaryMin: "R$ 1.500", salaryMax: "R$ 2.000",
      applicationLink: "vagas@comercialalfa.com.br",
      lgpdConsent: true, senaiDisclaimer: true,
    },
    {
      companyEmail: "rh@logfast.com.br",
      categorySlug: "logistica",
      status: "PENDING",
      title: "Motorista Entregador",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sáb, 06h–15h",
      responsibilities: "Entrega de mercadorias na Grande São Paulo.",
      requiredQualifications: "CNH categoria D. Experiência em entregas.",
      benefits: "VT + VR + Seguro de vida",
      salaryType: "FIXED", salaryMin: "R$ 2.500",
      applicationLink: "vagas@logfast.com.br",
      lgpdConsent: true, senaiDisclaimer: true,
    },

    // Vaga EM ANDAMENTO — seleção em curso
    {
      companyEmail: "rh@techsolucoes.com.br",
      categorySlug: "tecnologia",
      status: "IN_PROGRESS",
      title: "Suporte Técnico N1",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 08h–17h",
      responsibilities: "Atendimento ao usuário interno e suporte técnico básico.",
      requiredQualifications: "Conhecimento em Windows e pacote Office.",
      benefits: "VT + VR + Plano de saúde",
      salaryType: "FIXED", salaryMin: "R$ 1.900",
      applicationLink: "vagas@techsolucoes.com.br",
      lgpdConsent: true, senaiDisclaimer: true,
    },

    // Vaga REPROVADA — para testar visualização no painel empresa
    {
      companyEmail: "rh@comercialalfa.com.br",
      categorySlug: "marketing",
      status: "REJECTED",
      rejectionReason: "Descrição da vaga incompleta. Por favor, detalhe as responsabilidades e os requisitos.",
      title: "Analista de Marketing Digital",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 09h–18h",
      responsibilities: "Gestão de redes sociais.",
      requiredQualifications: "Ensino superior em Marketing.",
      benefits: "VT + VR",
      salaryType: "NEGOTIABLE",
      applicationLink: "vagas@comercialalfa.com.br",
      lgpdConsent: true, senaiDisclaimer: true,
    },
  ];

  for (const job of jobsData) {
    const companyId = companyIds[job.companyEmail];
    if (!companyId) continue;

    await prisma.job.create({
      data: {
        companyId,
        categoryId: categories[job.categorySlug],
        status: job.status,
        rejectionReason: job.rejectionReason ?? null,
        companyConfidential: job.companyConfidential ?? false,
        title: job.title,
        workLocation: job.workLocation ?? null,
        workSchedule: job.workSchedule ?? null,
        responsibilities: job.responsibilities ?? null,
        requiredQualifications: job.requiredQualifications ?? null,
        desiredQualifications: job.desiredQualifications ?? null,
        benefits: job.benefits ?? null,
        salaryType: job.salaryType,
        salaryMin: job.salaryMin ?? null,
        salaryMax: job.salaryMax ?? null,
        applicationDeadline: job.applicationDeadline ?? null,
        applicationLink: job.applicationLink ?? null,
        lgpdConsent: job.lgpdConsent,
        senaiDisclaimer: job.senaiDisclaimer,
      },
    });
  }

  console.log("\n✓ Seed concluído!\n");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(" USUÁRIOS PADRÃO PARA TESTE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(" Admin SENAI     → admin@senai.com.br          senai@2025");
  console.log(" Empresa 1       → rh@techsolucoes.com.br      empresa@2025");
  console.log(" Empresa 2       → rh@comercialalfa.com.br     empresa@2025");
  console.log(" Empresa 3       → rh@logfast.com.br           empresa@2025");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(" Vagas criadas: 4 ativas · 2 pendentes · 1 em andamento · 1 reprovada");
  console.log("═══════════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
