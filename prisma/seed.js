const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // ─── Categorias ───────────────────────────────────────────────────────────
  const categoryData = [
    { name: "Tecnologia", slug: "tecnologia" },
    { name: "Vendas", slug: "vendas" },
    { name: "Marketing", slug: "marketing" },
    { name: "Administrativo", slug: "administrativo" },
    { name: "Industrial", slug: "industrial" },
    { name: "Logística", slug: "logistica" },
    { name: "Saúde", slug: "saude" },
    { name: "Educação", slug: "educacao" },
  ];

  const categories = {};
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = c.id;
  }

  // ─── Admin SENAI ──────────────────────────────────────────────────────────
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

  // ─── Empresas ─────────────────────────────────────────────────────────────
  const companiesData = [
    {
      user: { name: "RH Tech Soluções", email: "rh@techsolucoes.com.br", password: "empresa@2025" },
      company: {
        name: "Tech Soluções LTDA",
        cnpj: "12.345.678/0001-90",
        description: "Empresa de tecnologia especializada em soluções para o varejo digital.",
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
    {
      user: { name: "RH Industria Forte", email: "rh@industriaforte.com.br", password: "empresa@2025" },
      company: {
        name: "Indústria Forte S.A.",
        cnpj: "33.222.111/0001-44",
        description: "Fabricante de equipamentos industriais para o setor metalúrgico.",
        contact: "Carlos Mendes — (11) 96666-3456",
      },
    },
    {
      user: { name: "RH Saúde Bem Estar", email: "rh@saudebemestar.com.br", password: "empresa@2025" },
      company: {
        name: "Saúde & Bem Estar Clínicas",
        cnpj: "77.888.999/0001-55",
        description: "Rede de clínicas com foco em saúde preventiva e bem-estar.",
        contact: "Fernanda Lima — (11) 95555-7890",
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

  // ─── Vagas ────────────────────────────────────────────────────────────────
  // Distribuição pensada para os gráficos do dashboard:
  //   - Variedade de contractType (CLT, APPRENTICE, INTERNSHIP, PJ)
  //   - Vagas COMPLETED com filledBy (SENAI_STUDENT e OTHER) para o gráfico de origem
  //   - Vários status para o gráfico de funil
  //   - Distribuição entre categorias para o gráfico por área

  const jobsData = [
    // ── TECH SOLUÇÕES ──────────────────────────────────────────────────────

    {
      companyEmail: "rh@techsolucoes.com.br",
      categorySlug: "tecnologia",
      status: "ACTIVE",
      contractType: "CLT",
      title: "Desenvolvedor Web Full Stack",
      workLocation: "São Paulo — SP (Híbrido)",
      workSchedule: "Seg–Sex, 09h–18h",
      responsibilities: "Desenvolver e manter aplicações web.\nParticipação em code reviews e planejamento técnico.",
      requiredQualifications: "Experiência com React e Node.js.\nConhecimento em banco de dados relacionais.",
      desiredQualifications: "Docker e CI/CD.\nMetodologias ágeis.",
      benefits: "VT + VR + Plano de saúde + PLR",
      salaryType: "RANGE", salaryMin: "R$ 4.000", salaryMax: "R$ 7.000",
      applicationLink: "vagas@techsolucoes.com.br",
    },
    {
      companyEmail: "rh@techsolucoes.com.br",
      categorySlug: "tecnologia",
      status: "ACTIVE",
      contractType: "CLT",
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
    },
    {
      companyEmail: "rh@techsolucoes.com.br",
      categorySlug: "tecnologia",
      status: "ACTIVE",
      contractType: "INTERNSHIP",
      title: "Estágio em Desenvolvimento de Software",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 06h/dia",
      responsibilities: "Apoio no desenvolvimento de features e correção de bugs.",
      requiredQualifications: "Cursando Tecnologia da Informação ou áreas afins.",
      benefits: "Bolsa + VT + VR",
      salaryType: "FIXED", salaryMin: "R$ 1.500",
      applicationLink: "vagas@techsolucoes.com.br",
    },
    {
      companyEmail: "rh@techsolucoes.com.br",
      categorySlug: "tecnologia",
      status: "IN_PROGRESS",
      contractType: "CLT",
      title: "Suporte Técnico N1",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 08h–17h",
      responsibilities: "Atendimento ao usuário interno e suporte técnico básico.",
      requiredQualifications: "Conhecimento em Windows e pacote Office.",
      benefits: "VT + VR + Plano de saúde",
      salaryType: "FIXED", salaryMin: "R$ 1.900",
      applicationLink: "vagas@techsolucoes.com.br",
    },
    {
      companyEmail: "rh@techsolucoes.com.br",
      categorySlug: "tecnologia",
      status: "COMPLETED",
      contractType: "CLT",
      filledBy: "SENAI_STUDENT",
      title: "Técnico em Redes",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 08h–17h",
      responsibilities: "Instalação e manutenção de infraestrutura de redes.",
      requiredQualifications: "Curso técnico em Redes ou TI.",
      benefits: "VT + VR + Plano de saúde",
      salaryType: "FIXED", salaryMin: "R$ 2.800",
      applicationLink: "vagas@techsolucoes.com.br",
    },
    {
      companyEmail: "rh@techsolucoes.com.br",
      categorySlug: "tecnologia",
      status: "COMPLETED",
      contractType: "APPRENTICE",
      filledBy: "SENAI_STUDENT",
      title: "Jovem Aprendiz em TI",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 20h/semana",
      responsibilities: "Apoio administrativo na área de TI e atendimento de chamados.",
      requiredQualifications: "Cursando ensino médio. Idade entre 14 e 24 anos.",
      benefits: "Bolsa + VT + VR",
      salaryType: "FIXED", salaryMin: "R$ 900",
      applicationLink: "vagas@techsolucoes.com.br",
    },

    // ── COMERCIAL ALFA ─────────────────────────────────────────────────────

    {
      companyEmail: "rh@comercialalfa.com.br",
      categorySlug: "vendas",
      status: "ACTIVE",
      contractType: "CLT",
      title: "Vendedor Interno",
      workLocation: "Santo André — SP",
      workSchedule: "Seg–Sáb, 09h–18h",
      responsibilities: "Atendimento ao cliente, negociação e fechamento de vendas.",
      requiredQualifications: "Ensino médio completo. Experiência em vendas.",
      benefits: "VT + VR + Comissão",
      salaryType: "FIXED", salaryMin: "R$ 2.200",
      applicationDeadline: new Date("2025-06-30"),
      applicationLink: "vagas@comercialalfa.com.br",
    },
    {
      companyEmail: "rh@comercialalfa.com.br",
      categorySlug: "administrativo",
      status: "ACTIVE",
      contractType: "CLT",
      title: "Auxiliar Administrativo",
      workLocation: "São Bernardo do Campo — SP",
      workSchedule: "Seg–Sex, 08h–17h",
      responsibilities: "Suporte às áreas administrativa e financeira.",
      requiredQualifications: "Ensino médio completo. Domínio do pacote Office.",
      benefits: "VT + VR",
      salaryType: "RANGE", salaryMin: "R$ 1.500", salaryMax: "R$ 2.000",
      applicationLink: "vagas@comercialalfa.com.br",
    },
    {
      companyEmail: "rh@comercialalfa.com.br",
      categorySlug: "marketing",
      status: "PENDING",
      contractType: "CLT",
      title: "Analista de Marketing Digital",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 09h–18h",
      responsibilities: "Gestão de redes sociais, campanhas digitais e SEO.",
      requiredQualifications: "Ensino superior em Marketing ou Publicidade.",
      benefits: "VT + VR",
      salaryType: "NEGOTIABLE",
      applicationLink: "vagas@comercialalfa.com.br",
    },
    {
      companyEmail: "rh@comercialalfa.com.br",
      categorySlug: "vendas",
      status: "COMPLETED",
      contractType: "APPRENTICE",
      filledBy: "SENAI_STUDENT",
      title: "Jovem Aprendiz em Vendas",
      workLocation: "Santo André — SP",
      workSchedule: "Seg–Sex, 20h/semana",
      responsibilities: "Apoio no atendimento ao cliente e organização do PDV.",
      requiredQualifications: "Cursando ensino médio.",
      benefits: "Bolsa + VT",
      salaryType: "FIXED", salaryMin: "R$ 850",
      applicationLink: "vagas@comercialalfa.com.br",
    },
    {
      companyEmail: "rh@comercialalfa.com.br",
      categorySlug: "administrativo",
      status: "COMPLETED",
      contractType: "INTERNSHIP",
      filledBy: "SENAI_STUDENT",
      title: "Estágio em Recursos Humanos",
      workLocation: "São Bernardo do Campo — SP",
      workSchedule: "Seg–Sex, 06h/dia",
      responsibilities: "Apoio nos processos de recrutamento e seleção.",
      requiredQualifications: "Cursando Administração ou Psicologia.",
      benefits: "Bolsa + VT + VR",
      salaryType: "FIXED", salaryMin: "R$ 1.200",
      applicationLink: "vagas@comercialalfa.com.br",
    },
    {
      companyEmail: "rh@comercialalfa.com.br",
      categorySlug: "marketing",
      status: "REJECTED",
      contractType: "CLT",
      rejectionReason: "Descrição da vaga incompleta. Por favor, detalhe melhor as responsabilidades e os requisitos obrigatórios.",
      title: "Assistente de Comunicação",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 09h–18h",
      responsibilities: "Criação de conteúdo.",
      requiredQualifications: "Ensino superior em Comunicação.",
      benefits: "VT + VR",
      salaryType: "NEGOTIABLE",
      applicationLink: "vagas@comercialalfa.com.br",
    },

    // ── LOGFAST ────────────────────────────────────────────────────────────

    {
      companyEmail: "rh@logfast.com.br",
      categorySlug: "logistica",
      status: "ACTIVE",
      contractType: "CLT",
      title: "Auxiliar de Logística",
      workLocation: "Guarulhos — SP",
      workSchedule: "Seg–Sex, 07h–16h",
      responsibilities: "Separação e expedição de mercadorias. Controle de estoque.",
      requiredQualifications: "Ensino médio completo. Disponibilidade para trabalho em galpão.",
      desiredQualifications: "Experiência com WMS ou ERP.",
      benefits: "VT + VR + Seguro de vida",
      salaryType: "FIXED", salaryMin: "R$ 1.800",
      applicationLink: "vagas@logfast.com.br",
    },
    {
      companyEmail: "rh@logfast.com.br",
      categorySlug: "logistica",
      status: "PENDING",
      contractType: "CLT",
      title: "Motorista Entregador",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sáb, 06h–15h",
      responsibilities: "Entrega de mercadorias na Grande São Paulo.",
      requiredQualifications: "CNH categoria D. Experiência em entregas.",
      benefits: "VT + VR + Seguro de vida",
      salaryType: "FIXED", salaryMin: "R$ 2.500",
      applicationLink: "vagas@logfast.com.br",
    },
    {
      companyEmail: "rh@logfast.com.br",
      categorySlug: "logistica",
      status: "COMPLETED",
      contractType: "CLT",
      filledBy: "OTHER",
      title: "Operador de Empilhadeira",
      workLocation: "Guarulhos — SP",
      workSchedule: "Seg–Sex, 06h–15h",
      responsibilities: "Operação de empilhadeira para movimentação de cargas.",
      requiredQualifications: "CNH e certificação de operador de empilhadeira.",
      benefits: "VT + VR + Seguro de vida",
      salaryType: "FIXED", salaryMin: "R$ 2.200",
      applicationLink: "vagas@logfast.com.br",
    },
    {
      companyEmail: "rh@logfast.com.br",
      categorySlug: "administrativo",
      status: "INACTIVE",
      contractType: "CLT",
      pauseReason: "Orçamento para a vaga foi temporariamente congelado. Retomamos em 60 dias.",
      title: "Analista de Roteirização",
      workLocation: "Guarulhos — SP",
      workSchedule: "Seg–Sex, 08h–17h",
      responsibilities: "Planejamento e otimização de rotas de entrega.",
      requiredQualifications: "Experiência em logística e ferramentas de roteirização.",
      benefits: "VT + VR + PLR",
      salaryType: "RANGE", salaryMin: "R$ 3.000", salaryMax: "R$ 4.500",
      applicationLink: "vagas@logfast.com.br",
    },

    // ── INDUSTRIA FORTE ────────────────────────────────────────────────────

    {
      companyEmail: "rh@industriaforte.com.br",
      categorySlug: "industrial",
      status: "ACTIVE",
      contractType: "CLT",
      title: "Operador de Máquinas CNC",
      workLocation: "Diadema — SP",
      workSchedule: "Seg–Sex, 06h–14h (turno)",
      responsibilities: "Operação e setup de máquinas CNC para usinagem de peças.",
      requiredQualifications: "Curso técnico em Mecânica ou Mecatrônica.",
      benefits: "VT + VR + Adicional noturno + PLR",
      salaryType: "FIXED", salaryMin: "R$ 3.200",
      applicationLink: "vagas@industriaforte.com.br",
    },
    {
      companyEmail: "rh@industriaforte.com.br",
      categorySlug: "industrial",
      status: "ACTIVE",
      contractType: "APPRENTICE",
      title: "Jovem Aprendiz Industrial",
      workLocation: "Diadema — SP",
      workSchedule: "Seg–Sex, 20h/semana",
      responsibilities: "Apoio na linha de produção e atividades de controle de qualidade.",
      requiredQualifications: "Cursando ensino médio. Idade entre 14 e 24 anos.",
      benefits: "Bolsa + VT + VR",
      salaryType: "FIXED", salaryMin: "R$ 900",
      applicationLink: "vagas@industriaforte.com.br",
    },
    {
      companyEmail: "rh@industriaforte.com.br",
      categorySlug: "industrial",
      status: "COMPLETED",
      contractType: "CLT",
      filledBy: "SENAI_STUDENT",
      title: "Técnico em Automação Industrial",
      workLocation: "Diadema — SP",
      workSchedule: "Seg–Sex, 07h–16h",
      responsibilities: "Manutenção de sistemas de automação e CLPs.",
      requiredQualifications: "Curso técnico em Automação ou Eletrotécnica.",
      benefits: "VT + VR + Plano de saúde + PLR",
      salaryType: "FIXED", salaryMin: "R$ 3.800",
      applicationLink: "vagas@industriaforte.com.br",
    },
    {
      companyEmail: "rh@industriaforte.com.br",
      categorySlug: "industrial",
      status: "COMPLETED",
      contractType: "INTERNSHIP",
      filledBy: "SENAI_STUDENT",
      title: "Estágio em Engenharia de Produção",
      workLocation: "Diadema — SP",
      workSchedule: "Seg–Sex, 06h/dia",
      responsibilities: "Apoio em projetos de melhoria de processo e análise de indicadores.",
      requiredQualifications: "Cursando Engenharia de Produção ou Mecânica.",
      benefits: "Bolsa + VT + VR",
      salaryType: "FIXED", salaryMin: "R$ 1.600",
      applicationLink: "vagas@industriaforte.com.br",
    },
    {
      companyEmail: "rh@industriaforte.com.br",
      categorySlug: "industrial",
      status: "PENDING",
      contractType: "CLT",
      title: "Soldador MIG/MAG",
      workLocation: "Diadema — SP",
      workSchedule: "Seg–Sex, 06h–14h",
      responsibilities: "Soldagem de estruturas metálicas conforme especificações técnicas.",
      requiredQualifications: "Curso técnico em Soldagem. Experiência mínima de 1 ano.",
      benefits: "VT + VR + Adicional de insalubridade",
      salaryType: "FIXED", salaryMin: "R$ 2.900",
      applicationLink: "vagas@industriaforte.com.br",
    },

    // ── SAÚDE & BEM ESTAR ─────────────────────────────────────────────────

    {
      companyEmail: "rh@saudebemestar.com.br",
      categorySlug: "saude",
      status: "ACTIVE",
      contractType: "CLT",
      title: "Técnico de Enfermagem",
      workLocation: "São Paulo — SP",
      workSchedule: "Escala 12x36",
      responsibilities: "Assistência a pacientes em procedimentos e administração de medicamentos.",
      requiredQualifications: "Curso técnico em Enfermagem e COREN ativo.",
      benefits: "VT + VR + Plano de saúde + Adicional noturno",
      salaryType: "FIXED", salaryMin: "R$ 2.600",
      applicationLink: "vagas@saudebemestar.com.br",
    },
    {
      companyEmail: "rh@saudebemestar.com.br",
      categorySlug: "saude",
      status: "ACTIVE",
      contractType: "PJ",
      title: "Nutricionista Clínico",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 08h–17h",
      responsibilities: "Atendimento de pacientes e elaboração de planos alimentares.",
      requiredQualifications: "Graduação em Nutrição e CRN ativo.",
      benefits: "Contrato PJ — Plano de saúde opcional",
      salaryType: "FIXED", salaryMin: "R$ 4.500",
      applicationLink: "vagas@saudebemestar.com.br",
    },
    {
      companyEmail: "rh@saudebemestar.com.br",
      categorySlug: "saude",
      status: "COMPLETED",
      contractType: "CLT",
      filledBy: "OTHER",
      title: "Recepcionista de Clínica",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 08h–17h",
      responsibilities: "Agendamento de consultas, atendimento presencial e telefônico.",
      requiredQualifications: "Ensino médio completo. Boa comunicação.",
      benefits: "VT + VR + Plano de saúde",
      salaryType: "FIXED", salaryMin: "R$ 1.900",
      applicationLink: "vagas@saudebemestar.com.br",
    },
    {
      companyEmail: "rh@saudebemestar.com.br",
      categorySlug: "administrativo",
      status: "PENDING",
      contractType: "CLT",
      title: "Coordenador Administrativo",
      workLocation: "São Paulo — SP",
      workSchedule: "Seg–Sex, 09h–18h",
      responsibilities: "Gestão de contratos, fornecedores e processos administrativos.",
      requiredQualifications: "Ensino superior em Administração. Experiência mínima de 3 anos.",
      benefits: "VT + VR + Plano de saúde + PLR",
      salaryType: "RANGE", salaryMin: "R$ 4.000", salaryMax: "R$ 5.500",
      applicationLink: "vagas@saudebemestar.com.br",
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
        contractType: job.contractType ?? "OTHER",
        rejectionReason: job.rejectionReason ?? null,
        filledBy: job.filledBy ?? null,
        pauseReason: job.pauseReason ?? null,
        companyConfidential: job.companyConfidential ?? false,
        title: job.title,
        workLocation: job.workLocation ?? null,
        workSchedule: job.workSchedule ?? null,
        responsibilities: job.responsibilities ?? null,
        requiredQualifications: job.requiredQualifications ?? null,
        desiredQualifications: job.desiredQualifications ?? null,
        benefits: job.benefits ?? null,
        salaryType: job.salaryType ?? "NEGOTIABLE",
        salaryMin: job.salaryMin ?? null,
        salaryMax: job.salaryMax ?? null,
        applicationDeadline: job.applicationDeadline ?? null,
        applicationLink: job.applicationLink ?? null,
        lgpdConsent: true,
        senaiDisclaimer: true,
      },
    });
  }

  const total = jobsData.length;
  const byStatus = jobsData.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log("\n Seed concluído!\n");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(" USUARIOS DE TESTE");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(" Admin          admin@senai.com.br            senai@2025");
  console.log(" Tech Soluções  rh@techsolucoes.com.br        empresa@2025");
  console.log(" Comercial Alfa rh@comercialalfa.com.br       empresa@2025");
  console.log(" Logfast        rh@logfast.com.br             empresa@2025");
  console.log(" Ind. Forte     rh@industriaforte.com.br      empresa@2025");
  console.log(" Saude          rh@saudebemestar.com.br       empresa@2025");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(` ${total} vagas criadas:`);
  Object.entries(byStatus).forEach(([s, n]) => console.log(`   ${s.padEnd(12)} ${n}`));
  console.log(" 6 SENAI_STUDENT · 3 OTHER nas vagas preenchidas");
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
