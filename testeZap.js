require("dotenv").config();
const axios = require("axios");
const User = require("./src/models/User");

async function validarBaseDeContatos() {
  try {
    const usuarios = await User.find({ whatsapp: { $exists: true } });
    const relatorio = { sucesso: [], falha: [] };

    console.log(`🔎 Iniciando validação de ${usuarios.length} contatos...`);

    for (const usuario of usuarios) {
      let fone = usuario.whatsapp.replace(/\D/g, "");
      if (!fone.startsWith("55")) fone = `55${fone}`;

      try {
        const url = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_INSTANCE_TOKEN}/send-text`;

        await axios.post(
          url,
          {
            phone: fone,
            message: `Teste de rotina EasyIce para ${usuario.nome}. ✅`,
          },
          { headers: { "client-token": process.env.ZAPI_CLIENT_TOKEN } }
        );

        relatorio.sucesso.push(usuario.nome);
        console.log(`✅ Enviado para: ${usuario.nome} (${fone})`);
      } catch (error) {
        const erroMsg = error.response ? error.response.data : error.message;
        relatorio.falha.push({
          nome: usuario.nome,
          fone: fone,
          erro: erroMsg,
        });
        console.error(
          `❌ Falha em: ${usuario.nome} (${fone}) | Motivo:`,
          erroMsg
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("\n--- RESULTADO FINAL ---");
    console.log(`Total Sucesso: ${relatorio.sucesso.length}`);
    console.log(`Total Falhas: ${relatorio.falha.length}`);
    console.table(relatorio.falha);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err.message);
  }
}

validarBaseDeContatos();
