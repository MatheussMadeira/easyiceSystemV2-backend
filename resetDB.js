require("dotenv").config();
const mongoose = require("mongoose");
const OrdemServico = require("./src/models/OrdemServico");

async function reset() {
  try {
    console.log("🔗 Conectando ao MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);

    console.log("🧹 Iniciando limpeza da coleção OrdemServico...");

    // Conta quantos documentos existem antes de apagar
    const totalAntes = await OrdemServico.countDocuments();
    console.log(`📊 Total de registros encontrados: ${totalAntes}`);

    // Comando para deletar absolutamente tudo nesta coleção
    const resultado = await OrdemServico.deleteMany({});

    console.log(
      `✅ Sucesso! Foram eliminados ${resultado.deletedCount} registros.`
    );

    // Verificação final
    const totalDepois = await OrdemServico.countDocuments();
    console.log(`📊 Total de registros agora: ${totalDepois}`);

    console.log("🚀 BANCO DE OS ZERADO COM SUCESSO!");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERRO AO ZERAR O BANCO:", error.message);
    process.exit(1);
  }
}

reset();
