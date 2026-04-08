const mongoose = require("mongoose");

const EquipamentoSchema = new mongoose.Schema(
  {
    numero: { type: Number, required: true },
    nome: { type: String, required: true },
    setor: { type: String, required: true },
  },
  { timestamps: true }
);

EquipamentoSchema.index({ setor: 1 });
EquipamentoSchema.index({ numero: 1 });

module.exports = mongoose.model("Equipamento", EquipamentoSchema);
