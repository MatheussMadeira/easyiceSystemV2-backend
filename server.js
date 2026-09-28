require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron"); // 👈 correto
const osService = require("./src/services/osService");
const routes = require("./src/routes/index");

const app = express();

const TZ = "America/Sao_Paulo";

// O host dorme por inatividade (ver GET /public/ping, usado por um serviço
// externo só pra manter o processo acordado) — um cron.schedule sozinho só
// dispara se o processo estiver de pé bem às 07h, o que não é garantido.
// Por isso qualquer requisição que acorda o servidor também tenta processar
// as preventivas, mas só a partir das 07h (nunca antes) e no máximo uma vez
// por dia — o cron continua existindo como caminho "normal" de todo dia.
let ultimoDiaProcessado = null;

function horaAtualBRT() {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
}

async function processarPreventivasSeForDia() {
  if (horaAtualBRT() < 7) return;
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(
    new Date(),
  );
  if (ultimoDiaProcessado === hoje) return;
  ultimoDiaProcessado = hoje;
  console.log("🔄 Processando serviços preventivos...");
  await osService.processarServicosFrequentes().catch(console.error);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  processarPreventivasSeForDia();
  next();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", routes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Banco EasyIce Conectado!");
    await processarPreventivasSeForDia();

    cron.schedule(
      "0 7 * * *",
      async () => {
        console.log("⏰ Cron: verificando serviços preventivos...");
        await processarPreventivasSeForDia();
      },
      { timezone: TZ },
    );

    console.log("✅ Cron de preventivas agendado (todos os dias às 07h)");
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
