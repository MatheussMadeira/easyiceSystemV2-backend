const mongoose = require("mongoose");

const ServicoFrequenteSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    descricao: { type: String },
    setor: { type: String, required: true },
    equipamento: { type: String, required: true },
    solicitantePadrao: { type: String, required: true },
    executorPadrao: { type: String, required: true },
    prioridade: { type: String, default: "Normal" },
    periodicidadeDias: { type: Number, required: true },
    ultimaExecucao: { type: Date, default: Date.now },
    proximaExecucao: { type: Date, required: true },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServicoFrequente", ServicoFrequenteSchema);
