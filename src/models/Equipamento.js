const mongoose = require("mongoose");

const EquipamentoSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true,
    index: true,
  },
  nome: {
    type: String,
    required: true,
    uppercase: true,
  },
  setor: {
    type: String,
    required: true,
    uppercase: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  empresa: {
    type: String,
    required: true,
    enum: ["FRUTA MIX", "PURA FRUTA"],
    default: "FRUTA MIX",
  },
});

module.exports = mongoose.model("Equipamento", EquipamentoSchema);
