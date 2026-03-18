const express = require("express");
const osRoutes = express.Router();
const osController = require("../controllers/osController");
const upload = require("../config/multer");
const permitir = require("../auth/authMiddleware");

const debugLog = (req, res, next) => {
  next();
};

const uploadFields = upload.fields([
  { name: "arquivoAbertura", maxCount: 1 },
  { name: "arquivoFechamento", maxCount: 1 },
]);

osRoutes.post(
  "/",
  debugLog,
  permitir(["SOLICITANTE", "ADMIN"]),
  (req, res, next) => {
    uploadFields(req, res, (err) => {
      if (err) {
        console.error("🔥 [ERRO MULTER]:", err.message);
        return next(err);
      }

      next();
    });
  },
  osController.create
);

osRoutes.get(
  "/",
  debugLog,
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  osController.read
);

osRoutes.get(
  "/opcoes",
  debugLog,
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  osController.getOptions
);

osRoutes.get(
  "/proximo-numero",
  debugLog,
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  osController.getNext
);

osRoutes.get(
  "/:id",
  debugLog,
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  osController.findById
);

osRoutes.patch(
  "/:id/inline",
  debugLog,
  permitir(["SOLICITANTE", "ADMIN"]),
  osController.updateInline
);

osRoutes.put(
  "/:id",
  debugLog,
  permitir(["SOLICITANTE", "EXECUTOR", "ADMIN"]),
  uploadFields,
  osController.update
);
osRoutes.patch("/numero/:numeroOS/pecas", osController.lancarPecas);

osRoutes.delete("/:id", debugLog, permitir(["ADMIN"]), osController.delete);

module.exports = osRoutes;
