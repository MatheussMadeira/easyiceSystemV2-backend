const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  funcoes: {
    type: [String],
    enum: ["SOLICITANTE", "EXECUTOR", "ADMIN"],
    default: ["SOLICITANTE"],
  },
  password: { type: String, required: true },
  ativo: { type: Boolean, default: true },
});

module.exports = mongoose.model("User", UserSchema);
