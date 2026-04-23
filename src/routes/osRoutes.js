const express = require("express");
const osRoutes = express.Router();
const osController = require("../controllers/osController");
const upload = require("../config/multer");
const permitir = require("../auth/authMiddleware");
const ServicoFrequente = require("../models/ServicoFrequente");

const debugLog = (req, res, next) => {
  next();
};

const uploadFields = upload.fields([
  { name: "arquivoAbertura", maxCount: 1 },
  { name: "arquivoFechamento", maxCount: 1 },
]);
osRoutes.get("/preventivas", permitir(["ADMIN"]), async (req, res) => {
  const lista = await ServicoFrequente.find().sort({ proximaExecucao: 1 });
  res.json(lista);
});

osRoutes.put("/preventivas/:id", permitir(["ADMIN"]), async (req, res) => {
  try {
    const dados = req.body;
    if (dados.periodicidadeDias) {
      const sf = await ServicoFrequente.findById(req.params.id);
      if (sf) {
        const novaProxima = new Date(sf.ultimaExecucao || new Date());
        novaProxima.setDate(
          novaProxima.getDate() + Number(dados.periodicidadeDias)
        );
        dados.proximaExecucao = novaProxima;
      }
    }

    const atualizado = await ServicoFrequente.findByIdAndUpdate(
      req.params.id,
      { $set: dados },
      { new: true }
    );

    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

osRoutes.patch(
  "/preventivas/:id/toggle",
  permitir(["ADMIN"]),
  async (req, res) => {
    const sf = await ServicoFrequente.findById(req.params.id);
    sf.ativo = !sf.ativo;
    await sf.save();
    res.json(sf);
  }
);

osRoutes.post(
  "/preventivas/:id/executar",
  permitir(["ADMIN"]),
  async (req, res) => {
    const sf = await ServicoFrequente.findById(req.params.id);
    const os = await osService.criarOSAutomatica(sf);
    res.json(os);
  }
);
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
