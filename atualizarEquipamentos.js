// scripts/atualizarEquipamentos.js
require("dotenv").config();
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");

const Equipamento = mongoose.model(
  "Equipamento",
  new mongoose.Schema(
    { numero: String, nome: String, setor: String },
    { strict: false }
  )
);

// ── Helpers ───────────────────────────────────────
function removerAcentos(str = "") {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function extrairSetorDaCamara(nome) {
  const n = removerAcentos(nome).toUpperCase();
  const match = n.match(/\(([^)]+)\)/);
  const conteudo = match ? match[1] : n;

  if (conteudo.includes("SORVETE")) return "SORVETE";
  if (conteudo.includes("MORANGO") || conteudo.includes("FRUTA CONG"))
    return "FRUTA CONG";
  if (conteudo.includes("EXPEDICAO")) return "EXPEDICAO";
  if (conteudo.includes("ACAI")) return "ACAI";
  if (conteudo.includes("BOMBOM")) return "BOMBOM DE FRUTA";
  if (conteudo.includes("PICOLE")) return "PICOLE";
  if (conteudo.includes("REFEITORIO")) return "QUALIDADE";
  if (conteudo.includes("LATICINIOS")) return "QUALIDADE";
  if (conteudo.includes("LOJA")) return "ESCRITORIO/RH/LOJA";
  if (n.includes("CONTEINER") || n.includes("PALETE")) return "EXPEDICAO";

  return "CAMARA";
}

function normalizarSetor(setor, nome) {
  const s = removerAcentos(setor || "")
    .toUpperCase()
    .trim();

  if (s === "MORANGO") return "FRUTA CONG";
  if (s === "ACAI" || s === "AÇAI") return "ACAI";
  if (s === "BOMBOM") return "BOMBOM DE FRUTA";
  if (s === "PICOLE") return "PICOLE";
  if (s === "EXPEDICAO" || s === "EXPEDICÃO") return "EXPEDICAO";
  if (s === "LOGISTICA") return "LOGISTICA";
  if (s === "CAMARA" || s === "CÂMARA") return extrairSetorDaCamara(nome);

  return s;
}

// ── Lê o Excel ────────────────────────────────────
function lerExcel(caminhoArquivo) {
  const workbook = XLSX.readFile(caminhoArquivo);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const equipamentos = [];

  for (const row of rows) {
    const numero = row[0];
    const setor = row[1];
    const nome = row[2];

    if (!numero || isNaN(Number(numero))) continue;

    equipamentos.push({
      numero: String(numero),
      nome: String(nome || "").trim(),
      setor: String(setor || "").trim(),
    });
  }

  return equipamentos;
}

async function atualizarEquipamentos() {
  const caminhoExcel = path.join(
    __dirname,
    "Relatorio Maquinario DESCRIÇAO COMPLETO.xlsx"
  );

  console.log(`📂 Lendo Excel: ${caminhoExcel}\n`);
  const dadosExcel = lerExcel(caminhoExcel);
  console.log(`📋 ${dadosExcel.length} equipamentos no Excel\n`);

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Banco conectado!\n");
  console.log("─".repeat(70));

  let atualizados = 0;
  let criados = 0;
  let erros = 0;

  for (const item of dadosExcel) {
    const setorNovo = normalizarSetor(item.setor, item.nome);

    try {
      const resultado = await Equipamento.findOneAndUpdate(
        { numero: item.numero },
        {
          numero: item.numero,
          setor: setorNovo,
          nome: item.nome,
        },
        {
          new: true,
          upsert: true,
        }
      );

      if (resultado) {
        const foiCriado =
          resultado.createdAt?.getTime() === resultado.updatedAt?.getTime();
        if (foiCriado) {
          console.log(
            `➕ #${item.numero.padEnd(4)} | CRIADO   | ${setorNovo} — "${
              item.nome
            }"`
          );
          criados++;
        } else {
          console.log(
            `✅ #${item.numero.padEnd(4)} | ATUALIZADO | ${item.setor.padEnd(
              20
            )} → ${setorNovo}`
          );
          atualizados++;
        }
      }
    } catch (err) {
      console.error(`❌ Erro #${item.numero}: ${err.message}`);
      erros++;
    }
  }

  console.log("─".repeat(70));
  console.log(`\n📊 RESUMO:`);
  console.log(`   ✅ Atualizados:  ${atualizados}`);
  console.log(`   ➕ Criados:      ${criados}`);
  console.log(`   ❌ Erros:        ${erros}`);

  await mongoose.disconnect();
  console.log("\n🔌 Desconectado.");
}

atualizarEquipamentos().catch((err) => {
  console.error("❌ Erro fatal:", err.message);
  process.exit(1);
});
