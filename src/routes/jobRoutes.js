const { Router } = require("express");
const jobController = require("../controllers/jobController");
const applicationController = require("../controllers/applicationController");

const router = Router();

// Rotas completamente públicas — acessadas pelos alunos no /mural
router.get("/", jobController.listPublicJobs);
router.get("/:id", jobController.getPublicJob);

// Candidatura — públicas (aluno não tem login)
router.get("/:id/applicants/check", applicationController.checkCpf);
router.post("/:id/apply", applicationController.apply);

module.exports = router;
