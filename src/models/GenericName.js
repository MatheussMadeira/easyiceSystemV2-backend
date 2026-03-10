const mongoose = require("mongoose");
const GenericSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = {
  Setor: mongoose.model("Setor", GenericSchema),
  Prioridade: mongoose.model("Prioridade", GenericSchema),
};
