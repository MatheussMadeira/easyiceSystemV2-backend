require("dotenv").config();
const mongoose = require("mongoose");
const OrdemServico = require("./src/models/OrdemServico");

async function corrigirJose() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔍 Buscando registros do JOSE sem acento...");

    // 1. Corrigir onde ele é SOLICITANTE
    const resSol = await OrdemServico.updateMany(
      { solicitante: "JOSÉ" },
      { $set: { solicitante: "JOSÉ RODRIGUES" } }
    );

    // 2. Corrigir onde ele é EXECUTOR
    const resExe = await OrdemServico.updateMany(
      { executor: "JOSÉ" },
      { $set: { executor: "JOSÉ RODRIGUES" } }
    );

    console.log(`\n✅ Finalizado!`);
    console.log(`👉 Solicitantes atualizados: ${resSol.modifiedCount}`);
    console.log(`👉 Executores atualizados: ${resExe.modifiedCount}`);

    process.exit();
  } catch (err) {
    console.error("❌ Erro:", err);
    process.exit(1);
  }
}

corrigirJose();
