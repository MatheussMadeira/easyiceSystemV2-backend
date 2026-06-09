require("dotenv").config();
const mongoose = require("mongoose");
const OrdemServico = require("./src/models/OrdemServico");
const ServicoFrequente = require("./src/models/ServicoFrequente");

async function corrigir() {
  await mongoose.connect(process.env.MONGO_URI);

  const os = await OrdemServico.findOne({ numeroOS: "1563" });
  if (!os) {
    console.log("OS não encontrada");
    return;
  }

  const servico = await ServicoFrequente.findById(os.servicoFrequenteId);
  if (!servico) {
    console.log("Serviço não encontrado");
    return;
  }

  const dataCorreta = new Date(servico.ultimaExecucao);

  await OrdemServico.findByIdAndUpdate(os._id, {
    dataAbertura: dataCorreta,
  });

  console.log(`✅ OS #1563 corrigida`);
  console.log(
    `   dataAbertura: ${new Date().toLocaleDateString(
      "pt-BR"
    )} → ${dataCorreta.toLocaleDateString("pt-BR")}`
  );

  await mongoose.disconnect();
}
corrigir().catch(console.error);
