const { Router } = require("express");
const authController = require("../controllers/authController");

const router = Router();

// POST /api/auth/login
router.post("/login", authController.login);

module.exports = router;
