require("dotenv").config();
const mongoose = require("mongoose");
const OrdemServico = require("./src/models/OrdemServico");

async function clean() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🧹 Iniciando limpeza de dados...");

    const camposParaCaps = [
      "solicitante",
      "executor",
      "setor",
      "equipamento",
      "situacao",
    ];

    console.log("🔠 Convertendo campos para CAPS...");

    for (const campo of camposParaCaps) {
      console.log(`⏳ Processando campo: ${campo}...`); // <-- Adicione isso
      const docs = await OrdemServico.find({ [campo]: { $exists: true } });
      for (let doc of docs) {
        if (typeof doc[campo] === "string") {
          const valorAntigo = doc[campo];
          const valorNovo = doc[campo].trim().toUpperCase();

          if (valorAntigo !== valorNovo) {
            // Só salva se realmente mudou
            doc[campo] = valorNovo;
            await doc.save();
          }
        }
      }
      console.log(`✅ Campo ${campo} finalizado!`); // <-- E isso
    }

    // --- CORREÇÕES ESPECÍFICAS ---
    const correcoes = [
      { errado: "JOSÉ", correto: "JOSÉ RODRIGUES" },
      { errado: "JOSE", correto: "JOSÉ RODRIGUES" },
      { errado: "JOSE RODRIGUES", correto: "JOSÉ RODRIGUES" },
      { errado: "FREDERICO", correto: "FREDERICO MADEIRA" },
      { errado: "CLAUDIO BISPO", correto: "CLÁUDIO BISPO" },
      { errado: "MANUTENCAO", correto: "MANUTENÇÃO" },
      {
        campo: "prioridade",
        errado: "ALTA",
        correto: "Emergencia (Atendimento Imediato)",
      },
      {
        campo: "prioridade",
        errado: "MÉDIA",
        correto: "Alta (No decorrer do dia)",
      },
      {
        campo: "prioridade",
        errado: "BAIXA",
        correto: "Normal (Sequência de execução)",
      },
      {
        campo: "prioridade",
        errado: "Normal",
        correto: "Normal (Sequência de execução)",
      },
    ];

    for (const c of correcoes) {
      if (c.campo === "prioridade") {
        await OrdemServico.updateMany(
          { prioridade: c.errado },
          { $set: { prioridade: c.correto } }
        );
      } else {
        await OrdemServico.updateMany(
          { solicitante: c.errado },
          { $set: { solicitante: c.correto } }
        );
        await OrdemServico.updateMany(
          { executor: c.errado },
          { $set: { executor: c.correto } }
        );
      }
    }

    console.log("✨ Limpeza concluída!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro no script:", err);
    process.exit(1);
  }
}

clean();
