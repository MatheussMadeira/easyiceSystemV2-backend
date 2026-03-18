const express = require("express");
const router = express.Router();
const logController = require("../controllers/logController");
const permitir = require("../auth/authMiddleware");


router.get("/", permitir(["ADMIN"]), logController.read);

module.exports = router;
