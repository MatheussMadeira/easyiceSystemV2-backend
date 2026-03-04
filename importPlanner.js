require("dotenv").config();
const mongoose = require("mongoose");
const xlsx = require("xlsx");

const OrdemServicoSchema = new mongoose.Schema({
  numeroOS: String,
  dataAbertura: Date,
  setor: String,
  solicitante: String,
  executor: String,
  prioridade: String,
  situacao: String,
  equipamento: String,
  descricaoAbertura: String,
  dataFechamento: Date,
  valorPecas: Number,
  observacoes: String,
  item_id_monday: String,
});

const OrdemServico = mongoose.model("OrdemServico", OrdemServicoSchema);

async function migrar() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado ao MongoDB para migração...");

    const workbook = xlsx.readFile("./dados.xlsx", {
      cellDates: true,
      cellText: false,
    });

    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      range: 4,
    });

    console.log(`📊 Lendo ${rawData.length} linhas da planilha...`);

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

    const dadosFormatados = rawData.map((item) => ({
      numeroOS: String(item["Número"] || ""),
      // Usando a nova função de formatação
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

    await OrdemServico.deleteMany({});
    await OrdemServico.insertMany(dadosFormatados);

    console.log("🚀 Migração concluída com sucesso!");
    process.exit();
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    process.exit(1);
  }
}

migrar();
