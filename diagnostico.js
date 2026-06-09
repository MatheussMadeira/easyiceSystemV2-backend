require("dotenv").config();
const mongoose = require("mongoose");
const osService = require("./src/services/osService");

async function rodar() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("⚡ Processando serviços frequentes manualmente...\n");
  await osService.processarServicosFrequentes();
  console.log("\n✅ Concluído!");
  await mongoose.disconnect();
}
rodar().catch(console.error);
