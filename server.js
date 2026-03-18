require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const routes = require("./src/routes/index");

const app = express();

app.use(cors());
app.use(express.json());
// Adicionado para suportar dados de formulários (importante para Multer)
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Banco EasyIce Conectado!"))
  .catch((err) => console.error("❌ Erro no Banco:", err));

app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error("======= 🔥 DETALHE DO ERRO GLOBAL =======");
  console.error("Mensagem:", err.message);
  console.error("Stack:", err.stack);

  if (err.code) {
    console.error("Código do Erro (Multer/Siste):", err.code);
  }

  if (err.errors) {
    console.error("Erros de Validação:", JSON.stringify(err.errors, null, 2));
  }

  res.status(err.status || 500).json({
    erro: err.message || "Erro interno no servidor",
    detalhes: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor V2 rodando em http://localhost:${PORT}`);
});
