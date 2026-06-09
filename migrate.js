// scripts/-tipo.js
require("dotenv").config();
const mongoose = require("mongoose");
const OrdemServico = require("./src/models/OrdemServico");

async function checar() {
  await mongoose.connect(process.env.MONGO_URI);

  const os = await OrdemServico.find({
    servicoFrequenteId: { $ne: null },
    situacao: { $in: ["EM ABERTO", "EM PROCESSO", "PRONTO PARA FINALIZAÇÃO"] },
  }).lean();

  console.log(`\n📋 ${os.length} OS(s) preventivas abertas:\n`);

  os.forEach((o) => {
    const correto = o.tipo === "PREVENTIVA";
    console.log(
      `#${o.numeroOS} | tipo: ${o.tipo ?? "❌ null"} | ${
        correto ? "✅ OK" : "❌ TIPO ERRADO — precisa corrigir"
      }`
    );
  });

  await mongoose.disconnect();
}
checar().catch(console.error);
