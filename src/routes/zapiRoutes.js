const express = require("express");
const zapiRoutes = express.Router();
const WppController = require("../controllers/zapiController");
const permitir = require("../auth/authMiddleware");

zapiRoutes.get(
  "/status",
  permitir(["ADMIN", "EXECUTOR", "SOLICITANTE"]),
  WppController.getStatus
);

module.exports = zapiRoutes;
