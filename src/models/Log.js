const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  usuario: { type: String, required: true },
  acao: { type: String, required: true }, 
  entidade: { type: String, required: true }, 
  detalhes: { type: String }, 
  data: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Log", LogSchema);
