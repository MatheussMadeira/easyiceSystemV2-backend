require("dotenv").config();
const axios = require("axios");

async function testarGrupo() {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const instanceToken = process.env.ZAPI_INSTANCE_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  const grupoId = "120363406963271752-group"; 

  const url = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;

  try {
    const response = await axios.post(
      url,
      {
        phone: grupoId,
        message:
          "🤖 *TESTE DE SISTEMA*\n\nEste é um aviso automático do novo sistema de manutenção. As notificações de OS agora cairão aqui! 🛠️",
      },
      {
        headers: { "client-token": clientToken },
      }
    );

    console.log("✅ MENSAGEM ENVIADA AO GRUPO!");
  } catch (error) {
    console.error(
      "❌ ERRO NO GRUPO:",
      error.response ? error.response.data : error.message
    );
  }
}

testarGrupo();
