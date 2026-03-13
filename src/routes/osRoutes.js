const express = require("express");
const osRoutes = express.Router();
const osController = require("../controllers/osController");
const upload = require("../config/multer");
const permitir = require("../auth/authMiddleware");

// 1. Criamos um middleware de log apenas para ver a requisição passando
const debugLog = (req, res, next) => {
  console.log(
    `--- [DEBUG ROTA] Recebendo ${req.method} para ${req.originalUrl} ---`
  );
  next();
};

const uploadFields = upload.fields([
  { name: "arquivoAbertura", maxCount: 1 },
  { name: "arquivoFechamento", maxCount: 1 },
]);

// 2. Aplicamos o log e um verificador após o Multer
osRoutes.post(
  "/",
  debugLog,
  permitir(["SOLICITANTE", "ADMIN"]),
  (req, res, next) => {
    console.log(
      "🛠️ [DEBUG ROTA] Entrando no processamento de arquivos (Multer)..."
    );
    uploadFields(req, res, (err) => {
      if (err) {
        console.error("🔥 [ERRO MULTER]:", err.message);
        // Isso aqui vai fazer o erro aparecer no log detalhadamente
        return next(err);
      }
      console.log(
        "✅ [DEBUG ROTA] Arquivos processados pelo Multer com sucesso!"
      );
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

osRoutes.delete("/:id", debugLog, permitir(["ADMIN"]), osController.delete);

module.exports = osRoutes;
