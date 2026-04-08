const express = require("express");
const equipamentoRoutes = express.Router();
const equipamentoController = require("../controllers/equipamentoController");
const permitir = require("../auth/authMiddleware");

equipamentoRoutes.get(
  "/",
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  equipamentoController.read
);

equipamentoRoutes.post("/", permitir(["ADMIN"]), equipamentoController.create);

equipamentoRoutes.put(
  "/:id",
  permitir(["ADMIN"]),
  equipamentoController.update
);

equipamentoRoutes.delete(
  "/:id",
  permitir(["ADMIN"]),
  equipamentoController.delete
);

equipamentoRoutes.post(
  "/carga",
  permitir(["ADMIN"]),
  equipamentoController.insertMany
);

module.exports = equipamentoRoutes;
