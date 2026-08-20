require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron"); // 👈 correto
const osService = require("./src/services/osService");
const routes = require("./src/routes/index");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", routes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Banco EasyIce Conectado!");
    console.log("🔄 Processando preventivas ao iniciar servidor...");
    await osService.processarServicosFrequentes().catch(console.error);
    cron.schedule(
      "0 7 * * 1-5",
      async () => {
        console.log("⏰ Cron: verificando serviços preventivos...");
        await osService.processarServicosFrequentes();
      },
      { timezone: "America/Sao_Paulo" },
    );

    console.log("✅ Cron de preventivas agendado (seg-sex às 07h)");
  })
  .catch((err) => {
    console.error("❌ Erro no Banco:", err);
    process.exit(1);
  });

app.use((err, req, res, next) => {
  console.error("======= 🔥 DETALHE DO ERRO GLOBAL =======");
  console.error("Mensagem:", err.message);
  res.status(err.status || 500).json({
    erro: err.message || "Erro interno no servidor",
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor V2 rodando na porta ${PORT}`);
});
