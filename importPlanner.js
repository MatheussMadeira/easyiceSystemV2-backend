require("dotenv").config();
const mongoose = require("mongoose");
const xlsx = require("xlsx");
const OrdemServico = require("./src/models/OrdemServico");

async function migrar() {
  try {
    console.log("🔗 Conectando ao MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);

    console.log("📂 Lendo arquivo dados.xlsx...");
    const workbook = xlsx.readFile("./dados.xlsx", { cellDates: true });
    const sheetName = workbook.SheetNames[0];

    // Range 4 pula as linhas de título do Monday
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      range: 4,
    });

    const formatarData = (valor) => {
      if (!valor) return null;
      const data = new Date(valor);
      return isNaN(data.getTime()) ? null : data;
    };

    let dadosParaInserir = [];
    let numerosVistos = new Set();

    for (let item of rawData) {
      let numeroRaw = item["Número"];

      // Pula se a linha não tiver número de OS
      if (numeroRaw === undefined || numeroRaw === "" || numeroRaw === null)
        continue;

      const numeroFinal = String(numeroRaw).trim();
      const dataAbertura = formatarData(item["Data de abertura"]);

      // Só adiciona se tiver data e não for duplicado na planilha
      if (dataAbertura && !numerosVistos.has(numeroFinal)) {
        numerosVistos.add(numeroFinal);

        dadosParaInserir.push({
          numeroOS: numeroFinal,
          dataAbertura: dataAbertura,
          setor: String(item["Setor"] || "N/A")
            .trim()
            .toUpperCase(),
          solicitante: String(item["Solicitante"] || "N/A")
            .trim()
            .toUpperCase(),
          executor: String(item["Executor"] || "NÃO ATRIBUÍDO")
            .trim()
            .toUpperCase(),
          prioridade: String(item["Prioridade"] || "NORMAL")
            .trim()
            .toUpperCase(),
          situacao: String(item["Situação"] || "EM ABERTO")
            .trim()
            .toUpperCase(),
          equipamento: String(item["Equipamento"] || "N/A")
            .trim()
            .toUpperCase(),
          descricaoAbertura: String(item["Descrição abertura"] || ""),
          dataFechamento: formatarData(item["Data de fechamento"]),
          valorPecas: Number(item["VALOR DE PEÇAS"]) || 0,
          descricaoProcesso: String(item["observaçoes"] || ""),
          descricaoFechamento: String(item["Descrição fechamento"] || ""),
          item_id_monday: String(item["Item ID (auto generated)"] || ""),
        });
      }
    }

    // ORDENAÇÃO: Garante que 2 venha antes de 10
    dadosParaInserir.sort((a, b) => Number(a.numeroOS) - Number(b.numeroOS));

    console.log(
      `📤 Inserindo ${dadosParaInserir.length} registros ordenados...`
    );

    // Inserção em lote
    await OrdemServico.insertMany(dadosParaInserir);

    console.log("🚀 TABELA POPULADA COM SUCESSO E EM ORDEM!");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERRO NA MIGRAÇÃO:", error.message);
    process.exit(1);
  }
}

migrar();
