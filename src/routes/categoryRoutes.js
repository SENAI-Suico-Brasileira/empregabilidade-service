const { Router } = require("express");
const categoryController = require("../controllers/categoryController");
const { authMiddleware, requireRole } = require("../middlewares/authMiddleware");

const router = Router();

// Pública: listar categorias para o filtro do mural
router.get("/", categoryController.listCategories);

// Protegidas: gerenciar categorias
router.post("/", authMiddleware, categoryController.createCategory);
router.delete("/:id", authMiddleware, categoryController.deleteCategory);

module.exports = router;
