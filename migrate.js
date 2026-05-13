// migracoes/migrar-periodicidade.js
require("dotenv").config();
const mongoose = require("mongoose");
const OrdemServico = require("./src/models/OrdemServico");
const ServicoFrequente = require("./src/models/ServicoFrequente");

async function migrar() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🔌 Conectado ao banco...\n");

  const osSemPeriodicidade = await OrdemServico.find({
    tipo: "PREVENTIVA",
    servicoFrequenteId: { $ne: null },
    $or: [
      { periodicidadeDias: null },
      { periodicidadeDias: { $exists: false } },
    ],
  });

  console.log(`📋 ${osSemPeriodicidade.length} OS(s) para migrar...\n`);

  let ok = 0;
  let erro = 0;

  for (const os of osSemPeriodicidade) {
    const servico = await ServicoFrequente.findById(os.servicoFrequenteId);
    if (servico?.periodicidadeDias) {
      await OrdemServico.findByIdAndUpdate(os._id, {
        periodicidadeDias: servico.periodicidadeDias,
      });
      console.log(
        `✅ OS #${os.numeroOS} → periodicidadeDias: ${servico.periodicidadeDias} dias`
      );
      ok++;
    } else {
      console.warn(`⚠️  OS #${os.numeroOS} → ServicoFrequente não encontrado`);
      erro++;
    }
  }

  console.log(`\n✅ Migradas: ${ok} | ⚠️  Ignoradas: ${erro}`);
  await mongoose.disconnect();
  console.log("🔌 Desconectado.");
}

migrar().catch((err) => {
  console.error("❌ Erro na migração:", err.message);
  process.exit(1);
});
