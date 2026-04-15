const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  funcoes: {
    type: [String],
    enum: ["SOLICITANTE", "EXECUTOR", "ADMIN"],
    default: ["SOLICITANTE"],
  },
  whatsapp: { type: String },
  password: { type: String, required: true },
  ativo: { type: Boolean, default: true },
  resetCode: { type: String, default: null },
  resetCodeExpiry: { type: Date, default: null },
});

module.exports = mongoose.model("User", UserSchema);
