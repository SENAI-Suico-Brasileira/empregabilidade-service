const { Router } = require("express");
const jobController = require("../controllers/jobController");

const router = Router();

// Rotas completamente públicas — acessadas pelos alunos no /mural
router.get("/", jobController.listPublicJobs);
router.get("/:id", jobController.getPublicJob);

module.exports = router;
