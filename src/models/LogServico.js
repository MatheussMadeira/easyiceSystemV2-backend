const mongoose = require("mongoose");

const LogServicoSchema = new mongoose.Schema(
  {
    servicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Servico",
      required: true,
    },
    nomeServico: String,
    executor: String,
    dataExecucao: { type: Date, default: Date.now }, // Quando ele clicou no botão
    dataPlanejada: Date, // Quando era para ter sido feito
    atrasoDias: Number,
    status: {
      type: String,
      enum: ["NO PRAZO", "ATRASADO"],
      default: "NO PRAZO",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LogServico", LogServicoSchema);
