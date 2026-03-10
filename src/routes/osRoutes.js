const express = require("express");
const osRoutes = express.Router();
const osController = require("../controllers/osController");
const upload = require("../config/multer");
const permitir = require("../auth/authMiddleware");

const uploadFields = upload.fields([
  { name: "arquivoAbertura", maxCount: 1 },
  { name: "arquivoFechamento", maxCount: 1 },
]);

osRoutes.post(
  "/",
  permitir(["SOLICITANTE", "ADMIN"]),
  uploadFields,
  osController.create
);

osRoutes.get(
  "/",
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  osController.read
);
osRoutes.get(
  "/opcoes",
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  osController.getOptions
);
osRoutes.get(
  "/proximo-numero",
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  osController.getNext
);
osRoutes.get(
  "/:id",
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  osController.findById
);

osRoutes.patch(
  "/:id/inline",
  permitir(["SOLICITANTE", "ADMIN"]),
  osController.updateInline
);

osRoutes.put(
  "/:id",
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  uploadFields,
  osController.update
);

osRoutes.delete("/:id", permitir(["ADMIN"]), osController.delete);

module.exports = osRoutes;
