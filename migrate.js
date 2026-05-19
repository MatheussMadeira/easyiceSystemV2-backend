// migracoes/corrigir-proxima-execucao.js
require("dotenv").config();
const mongoose = require("mongoose");
const ServicoFrequente = require("./src/models/ServicoFrequente");

async function migrar() {
await mongoose.connect(process.env.MONGO_URI);
console.log("🔌 Conectado ao banco...\n");

const servicos = await ServicoFrequente.find({ ativo: true });
console.log(`📋 ${servicos.length} serviço(s) para verificar...\n`);

let corrigidos = 0;

for (const s of servicos) {
  const baseDate = new Date(s.ultimaExecucao || s.createdAt);
  const proximaCorreta = new Date(baseDate);
  proximaCorreta.setDate(proximaCorreta.getDate() + s.periodicidadeDias);

  const proximaAtual = new Date(s.proximaExecucao);
  const diferencaDias = Math.abs(
    Math.round((proximaCorreta - proximaAtual) / (1000 * 60 * 60 * 24))
  );

  // Só corrige se houver diferença maior que 1 dia
  if (diferencaDias > 1) {
    await ServicoFrequente.findByIdAndUpdate(s._id, {
      proximaExecucao: proximaCorreta,
    });

    console.log(
      `🔧 "${s.nome}"\n` +
      `   Antes:   ${proximaAtual.toLocaleDateString("pt-BR")}\n` +
      `   Depois:  ${proximaCorreta.toLocaleDateString("pt-BR")}\n` +
      `   Base:    ultimaExecucao (${baseDate.toLocaleDateString("pt-BR")}) + ${s.periodicidadeDias} dias\n`
    );
    corrigidos++;
  } else {
    console.log(`✅ "${s.nome}" — já está correto`);
  }
}

console.log(`\n✅ Corrigidos: ${corrigidos} | Total: ${servicos.length}`);
await mongoose.disconnect();
}

migrar().catch((err) => {
console.error("❌ Erro:", err.message);
process.exit(1);
});
