const { Router } = require("express");
const { authMiddleware, requireRole } = require("../middlewares/authMiddleware");
const companyController = require("../controllers/companyController");

const router = Router();

// Todas as rotas exigem autenticação + role COMPANY
router.use(authMiddleware, requireRole("COMPANY"));

router.get("/perfil", companyController.getProfile);
router.put("/perfil", companyController.updateProfile);

router.get("/vagas", companyController.listOwnJobs);
router.post("/vagas", companyController.createJob);
router.patch("/vagas/:id/status", companyController.updateJobStatus);

module.exports = router;
