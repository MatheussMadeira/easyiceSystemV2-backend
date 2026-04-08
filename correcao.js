require("dotenv").config();
const mongoose = require("mongoose");
const Equipamento = require("./src/models/Equipamento");
const { Setor } = require("./src/models/GenericName");

const normalizar = (texto) =>
  texto
    ? texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
    : "";

async function rodarAuditoria() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Conectado ao banco para Auditoria Inteligente...\n");

    const listaSetoresBanco = await Setor.find({});
    const setoresValidosNormalizados = listaSetoresBanco.map((s) =>
      normalizar(s.nome)
    );

    console.log(
      `📋 Setores oficiais (Normalizados): [${setoresValidosNormalizados.join(
        ", "
      )}]`
    );
    console.log("--------------------------------------------------\n");

    const todosEquipamentos = await Equipamento.find({});

    const intrusos = todosEquipamentos.filter((maq) => {
      const setorMaqNormalizado = normalizar(maq.setor);
      return !setoresValidosNormalizados.includes(setorMaqNormalizado);
    });

    if (intrusos.length === 0) {
      console.log(
        "✅ TUDO LIMPO! Todos os equipamentos batem com os setores oficiais."
      );
    } else {
      console.log(
        `🚨 ENCONTRADOS ${intrusos.length} EQUIPAMENTOS COM SETOR FORA DO PADRÃO:\n`
      );

      intrusos.forEach((maq) => {
        console.log(`- [Nº ${maq.numero}] ${maq.nome}`);
        console.log(`  Setor no Banco: "${maq.setor}"`);
        console.log(
          `  Motivo: Não bate com nenhum setor oficial (mesmo ignorando acentos).\n`
        );
      });
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro na auditoria:", err.message);
    process.exit(1);
  }
}

rodarAuditoria();
