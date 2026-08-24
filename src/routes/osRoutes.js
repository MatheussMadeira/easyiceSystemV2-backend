const express = require("express");
const osRoutes = express.Router();
const osController = require("../controllers/osController");
const osService = require("../services/osService");
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

    const sf = await ServicoFrequente.findById(req.params.id);
    if (!sf) {
      return res.status(404).json({ erro: "Serviço frequente não encontrado." });
    }

    if (dados.periodicidadeDias) {
      dados.proximaExecucao = osService._agendarProximaExecucao(
        sf.ultimaExecucao || new Date(),
        dados.periodicidadeDias
      );
    }

    const atualizado = await ServicoFrequente.findByIdAndUpdate(
      req.params.id,
      { $set: dados },
      { new: true }
    );

    // Replica a nova periodicidade / tempo de execução nas OS já abertas por
    // este serviço, senão elas seguem calculando prazo pelo valor antigo.
    const sincronizacao = await osService.sincronizarOSPendentes(
      atualizado,
      sf,
      req.usuario?.nome || "Sistema"
    );

    res.json({ ...atualizado.toObject(), sincronizacao });
  } catch (err) {
    console.error("❌ Erro ao atualizar preventiva:", err.message);
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
    try {
      const sf = await ServicoFrequente.findById(req.params.id);
      if (!sf) {
        return res.status(404).json({ erro: "Serviço frequente não encontrado." });
      }

      // Geração manual não dispara WhatsApp por padrão — é usada para corrigir
      // OS apagadas por engano. Envie { notificar: true } para avisar o executor.
      const notificar = req.body?.notificar === true;

      const os = await osService.criarOSAutomatica(sf, {
        notificar,
        alinharProximaExecucao: true,
      });
      return res.status(201).json(os);
    } catch (err) {
      console.error("❌ Erro ao gerar OS manual:", err.message);
      return res.status(500).json({ erro: err.message });
    }
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
