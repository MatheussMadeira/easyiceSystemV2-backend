require("dotenv").config();
const mongoose = require("mongoose");
const OrdemServico = require("./src/models/OrdemServico");

async function clean() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🧹 Iniciando limpeza de dados...");

    console.log("🔠 Convertendo campos para CAPS e limpando espaços...");

    const camposParaCaps = [
      "solicitante",
      "executor",
      "setor",
      "equipamento",
      "situacao",
      "prioridade",
    ];

    for (const campo of camposParaCaps) {
      await OrdemServico.updateMany(
        { [campo]: { $exists: true, $type: "string" } },
        [
          {
            $set: {
              [campo]: { $trim: { input: { $toUpper: `$${campo}` } } },
            },
          },
        ]
      );
    }
    console.log("✅ Todos os campos agora estão em CAPS.");

    const correcoes = [
      { errado: "JOSÉ", correto: "JOSÉ RODRIGUES" },
      { errado: "JOSE", correto: "JOSÉ RODRIGUES" },
      { errado: "JOSE RODRIGUES", correto: "JOSÉ RODRIGUES" },
      { errado: "MANUTENCAO", correto: "MANUTENÇÃO" },
    ];

    for (const c of correcoes) {
      const resSol = await OrdemServico.updateMany(
        { solicitante: c.errado },
        { $set: { solicitante: c.correto } }
      );

      const resExe = await OrdemServico.updateMany(
        { executor: c.errado },
        { $set: { executor: c.correto } }
      );

      if (resSol.modifiedCount > 0 || resExe.modifiedCount > 0) {
        console.log(
          `✅ Padronizado: "${c.errado}" -> "${c.correto}" (${
            resSol.modifiedCount + resExe.modifiedCount
          } alterações)`
        );
      }
    }

    // --- PASSO 3: REMOVER REGISTROS INDESEJADOS (Opcional) ---
    // Se você quiser deletar de vez registros que não devem aparecer
    console.log("🗑️ Removendo registros marcados para exclusão...");
    const resDel = await OrdemServico.deleteMany({
      $or: [
        { solicitante: "REMOVER" },
        { executor: "REMOVER" },
        { numeroOS: "" }, // Exemplo: remove se não tiver número
      ],
    });
    if (resDel.deletedCount > 0)
      console.log(`🗑️ ${resDel.deletedCount} registros deletados.`);

    console.log("✨ Limpeza concluída!");
    process.exit();
  } catch (err) {
    console.error("❌ Erro:", err);
    process.exit(1);
  }
}
clean();
