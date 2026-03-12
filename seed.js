require("dotenv").config();
const mongoose = require("mongoose");
const xlsx = require("xlsx");
// Importe o seu model real para garantir que os tipos de dados batam
const OrdemServico = require("./src/models/OrdemServico");

async function migrar() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado ao MongoDB. Iniciando reset de OS...");

    // 1. Lendo a Planilha
    const workbook = xlsx.readFile("./dados.xlsx", {
      cellDates: true,
      cellText: false,
    });

    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      range: 4, // Pula as primeiras 4 linhas conforme sua planilha anterior
    });

    console.log(`📊 Lendo ${rawData.length} linhas da nova planilha...`);

    const formatarDataSeguro = (valor) => {
      if (!valor) return null;
      if (valor instanceof Date) {
        valor.setHours(valor.getHours() + 3);
        return valor;
      }
      if (typeof valor === "number") {
        return new Date(Math.round((valor - 25569) * 86400 * 1000));
      }
      const data = new Date(valor);
      return isNaN(data.getTime()) ? null : data;
    };

    // 2. Mapeamento - AJUSTE OS NOMES ENTRE ASAS [" "] SE MUDARAM NA PLANILHA
    const dadosFormatados = rawData.map((item) => ({
      numeroOS: String(item["Número"] || ""),
      dataAbertura: formatarDataSeguro(item["Data de abertura"]),
      setor: item["Setor"] || "N/A",
      solicitante: item["Solicitante"] || "N/A",
      executor: item["Executor"] || "Não Atribuído",
      prioridade: item["Prioridade"] || "Normal",
      situacao: item["Situação"] || "EM ABERTO",
      equipamento: item["Equipamento"] || "N/A",
      descricaoAbertura: item["Descrição abertura"] || "",
      dataFechamento: formatarDataSeguro(item["Data de fechamento"]),
      valorPecas: Number(item["VALOR DE PEÇAS"]) || 0,
      observacoes: item["Observações"] || "",
      item_id_monday: String(item["Item ID (auto generated)"] || ""),
    }));

    // 3. Reset da Coleção de OS
    console.log("🗑️ Apagando ordens de serviço antigas...");
    await OrdemServico.deleteMany({}); // APAGA APENAS AS OS, MANTÉM USUÁRIOS

    // 4. Inserção das novas
    console.log("📤 Inserindo novos dados...");
    await OrdemServico.insertMany(dadosFormatados);

    console.log("🚀 Migração de OS concluída com sucesso!");
    process.exit();
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    process.exit(1);
  }
}

migrar();
