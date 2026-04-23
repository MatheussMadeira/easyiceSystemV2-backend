require("dotenv").config();
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");

const Equipamento = mongoose.model(
  "Equipamento",
  new mongoose.Schema({}, { strict: false })
);

async function exportar() {
  await mongoose.connect(process.env.MONGO_URI);

  const dados = await Equipamento.find(
    {},
    { numero: 1, nome: 1, setor: 1, _id: 0 }
  )
    .sort({ numero: 1 })
    .collation({ locale: "en_US", numericOrdering: true });

  const linhas = dados.map((d) => ({
    Número: d.numero,
    Nome: d.nome,
    Setor: d.setor,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(linhas);
  XLSX.utils.book_append_sheet(wb, ws, "Equipamentos");

  const caminho = path.join(__dirname, "equipamentos_export.xlsx");
  XLSX.writeFile(wb, caminho);

  console.log(`✅ ${dados.length} equipamentos exportados → ${caminho}`);
  await mongoose.disconnect();
}

exportar().catch(console.error);
