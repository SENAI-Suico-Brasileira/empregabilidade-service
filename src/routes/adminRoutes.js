const { Router } = require("express");
const { authMiddleware, requireRole } = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");
const applicationController = require("../controllers/applicationController");

const router = Router();

// Todas as rotas exigem autenticação + role ADMIN
router.use(authMiddleware, requireRole("ADMIN"));

router.get("/indicadores", adminController.getIndicators);

router.get("/vagas", adminController.listAllJobs);
router.patch("/vagas/:id/aprovar", adminController.approveJob);
router.patch("/vagas/:id/reprovar", adminController.rejectJob);
router.get("/vagas/:id/candidatos", applicationController.listApplicants);

router.get("/empresas", adminController.listCompanies);
router.post("/empresas", adminController.createCompany);
router.get("/empresas/:id", adminController.getCompany);
router.put("/empresas/:id", adminController.updateCompany);

module.exports = router;
