const { Router } = require("express");
const { authMiddleware, requireRole } = require("../middlewares/authMiddleware");
const companyController = require("../controllers/companyController");
const applicationController = require("../controllers/applicationController");

const router = Router();

// Todas as rotas exigem autenticação + role COMPANY
router.use(authMiddleware, requireRole("COMPANY"));

router.get("/perfil", companyController.getProfile);
router.put("/perfil", companyController.updateProfile);

router.get("/vagas/templates", companyController.listCompletedTemplates);
router.get("/vagas", companyController.listOwnJobs);
router.post("/vagas", companyController.createJob);
router.patch("/vagas/:id/status", companyController.updateJobStatus);

// Candidatos de uma vaga da empresa
router.get("/vagas/:id/candidatos", applicationController.listApplicants);

module.exports = router;
