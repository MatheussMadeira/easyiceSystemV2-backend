require("dotenv").config();
const mongoose = require("mongoose");
const xlsx = require("xlsx");
const Equipamento = require("./src/models/Equipamento");

async function rodarCarga() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Conectado ao banco de dados...");

    const workbook = xlsx.readFile("equipamento.xlsx");
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const dadosExcel = xlsx.utils.sheet_to_json(sheet, { range: 1 });

    const equipamentosParaSalvar = [];

    for (const row of dadosExcel) {
      const chaves = Object.keys(row);

      const numero = String(row[chaves[0]] || "").trim();
      let setor = String(row[chaves[1]] || "").trim();
      let nome = String(row[chaves[2]] || "").trim();

      if (numero && setor && nome) {
        const setorMinusculo = setor.toLowerCase();
        if (
          setorMinusculo.includes("camara") ||
          setorMinusculo.includes("câmara")
        ) {
          const conteudoParenteses = setor.match(/\((.*?)\)/);

          if (conteudoParenteses && conteudoParenteses[1]) {
            const setorReal = conteudoParenteses[1].trim();

            nome = `Câmara - ${nome}`;
            setor = setorReal;
          }
        }

        setor = setor.charAt(0).toUpperCase() + setor.slice(1);

        equipamentosParaSalvar.push({ numero, setor, nome });
      }
    }

    console.log(
      `📊 ${equipamentosParaSalvar.length} equipamentos lidos e tratados.`
    );

    console.log("🧹 Limpando base de equipamentos antiga...");
    await Equipamento.deleteMany({});

    console.log("🚀 Inserindo equipamentos limpos e padronizados...");
    await Equipamento.insertMany(equipamentosParaSalvar);

    console.log("✅ Carga finalizada com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

rodarCarga();
