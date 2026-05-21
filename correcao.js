// corrigir-data-abertura.js
require("dotenv").config();
const mongoose = require("mongoose");
const OrdemServico = require("./src/models/OrdemServico");
const ServicoFrequente = require("./src/models/ServicoFrequente");

async function corrigir() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🔌 Conectado...\n");

  const servicos = await ServicoFrequente.find({ ativo: true });

  for (const s of servicos) {
    // Busca OS aberta desse serviço
    const osAberta = await OrdemServico.findOne({
      servicoFrequenteId: s._id,
      situacao: "EM ABERTO",
    }).sort({ dataAbertura: -1 });

    if (!osAberta) continue;

    // Busca última OS concluída desse serviço
    const ultimaConcluida = await OrdemServico.findOne({
      servicoFrequenteId: s._id,
      situacao: "CONCLUÍDO",
    }).sort({ dataFechamento: -1 });

    if (!ultimaConcluida) continue;

    const dataCorreta = new Date(
      ultimaConcluida.dataFechamento || ultimaConcluida.dataAbertura
    );

    // Só corrige se dataAbertura for diferente da dataCorreta
    const dataAtual = new Date(osAberta.dataAbertura);
    dataAtual.setHours(0, 0, 0, 0);
    dataCorreta.setHours(0, 0, 0, 0);

    if (dataAtual.getTime() === dataCorreta.getTime()) {
      console.log(
        `⏭️  OS #${osAberta.numeroOS} "${s.nome}" — data já correta, pulando`
      );
      continue;
    }

    await OrdemServico.findByIdAndUpdate(osAberta._id, {
      dataAbertura: dataCorreta,
    });

    console.log(`✅ OS #${osAberta.numeroOS} "${s.nome}"`);
    console.log(
      `   dataAbertura: ${dataAtual.toLocaleDateString(
        "pt-BR"
      )} → ${dataCorreta.toLocaleDateString("pt-BR")}\n`
    );
  }

  console.log("✅ Concluído!");
  await mongoose.disconnect();
}

corrigir().catch(console.error);
