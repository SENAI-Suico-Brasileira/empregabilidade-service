const { Router } = require("express");
const authRoutes = require("./authRoutes");
const jobRoutes = require("./jobRoutes");
const categoryRoutes = require("./categoryRoutes");
const companyRoutes = require("./companyRoutes");
const adminRoutes = require("./adminRoutes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/jobs", jobRoutes);           // Público — /mural
router.use("/categories", categoryRoutes);// Público — filtros do mural
router.use("/empresa", companyRoutes);    // Privado COMPANY — /empresas
router.use("/adm", adminRoutes);          // Privado ADMIN — /adm

module.exports = router;
