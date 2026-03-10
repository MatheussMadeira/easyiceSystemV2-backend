require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const OrdemServico = require("./src/models/OrdemServico");

const gerarEmailBase = (nome) => {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[()]/g, "");
};

async function popularBanco() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Reset Total e Limpeza de Índices
    console.log("🧹 Limpando usuários e sincronizando índices...");
    await User.deleteMany({});
    await User.syncIndexes();

    const [solicitantesOS, executoresOS] = await Promise.all([
      OrdemServico.distinct("solicitante"),
      OrdemServico.distinct("executor"),
    ]);

    const usuariosUnicos = [
      ...new Set(
        [...solicitantesOS, ...executoresOS].map((n) => n?.trim().toUpperCase())
      ),
    ].filter(Boolean);

    const emailsUtilizados = new Set();
    console.log(`👥 Processando ${usuariosUnicos.length} nomes...`);

    for (const nome of usuariosUnicos) {
      let emailBase = gerarEmailBase(nome);
      let emailFinal = `${emailBase}@easyice.com.br`;
      let contador = 1;

      // Lógica de Desempate: Se o e-mail já foi usado por outro "Nome" neste loop
      while (emailsUtilizados.has(emailFinal)) {
        contador++;
        emailFinal = `${emailBase}${contador}@easyice.com.br`;
      }

      emailsUtilizados.add(emailFinal);

      const roles = [];
      if (solicitantesOS.some((n) => n?.toUpperCase() === nome))
        roles.push("SOLICITANTE");
      if (executoresOS.some((n) => n?.toUpperCase() === nome))
        roles.push("EXECUTOR");

      await User.create({
        nome,
        email: emailFinal,
        funcoes: roles,
        password: "123",
        ativo: true,
      });
    }

    console.log("\n✅ Migração concluída sem erros de duplicata!");
    process.exit();
  } catch (err) {
    console.error("❌ Erro crítico:", err);
    process.exit(1);
  }
}

popularBanco();
