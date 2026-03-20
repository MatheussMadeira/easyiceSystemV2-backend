const mongoose = require("mongoose");

const OrdemServicoSchema = new mongoose.Schema(
  {
    numeroOS: { type: String, required: true, unique: true },
    dataAbertura: { type: Date, required: true },
    setor: { type: String, required: true, default: "N/A" },
    solicitante: { type: String, required: true, default: "N/A" },
    executor: { type: String, required: true, default: "Não Atribuído" },
    prioridade: { type: String, required: true, default: "Normal" },
    situacao: { type: String, required: true, default: "EM ABERTO" },
    equipamento: { type: String, required: true, default: "N/A" },
    descricaoAbertura: { type: String },
    arquivoAbertura: { type: String },
    descricaoProcesso: { type: String },
    dataPrevista: {
      type: Date,
      required: false,
    },
    dataFechamento: { type: Date },
    pecasUtilizadas: { type: String },
    valorPecas: { type: Number, default: 0 },
    valorMaoDeObra: { type: Number, default: 0 },

    observacoes: { type: String },
    arquivoFechamento: { type: String },
    descricaoFechamento: { type: String },
  },
  { timestamps: true }
);

OrdemServicoSchema.index({ numeroOS: -1 });
OrdemServicoSchema.index({ setor: 1 });
OrdemServicoSchema.index({ solicitante: 1 });

module.exports = mongoose.model("OrdemServico", OrdemServicoSchema);
