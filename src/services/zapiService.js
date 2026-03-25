require("dotenv").config();
const axios = require("axios");

const enviarZap = async (numero, mensagem) => {
  if (!numero) return;

  let destinatario;
  if (
    numero.includes("-") ||
    numero.includes("group") ||
    numero.includes("@g.us")
  ) {
    destinatario = numero;
  } else {
    const numeroLimpo = numero.replace(/\D/g, "");
    destinatario = numeroLimpo.startsWith("55")
      ? numeroLimpo
      : `55${numeroLimpo}`;
  }

  const url = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_INSTANCE_TOKEN}/send-text`;

  try {
    await axios.post(
      url,
      {
        phone: destinatario,
        message: mensagem,
      },
      {
        headers: { "client-token": process.env.ZAPI_CLIENT_TOKEN },
      }
    );
    console.log(`✅ Zap enviado para ${destinatario}`);
  } catch (error) {
    console.error("❌ Erro Z-API:", error.response?.data || error.message);
  }
};

const verificarStatusZap = async () => {
  const urlStatus = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_INSTANCE_TOKEN}/status`;

  try {
    const response = await axios.get(urlStatus, {
      headers: { "client-token": process.env.ZAPI_CLIENT_TOKEN },
    });

    return response.data.connected;
  } catch (error) {
    console.error(
      "❌ Erro ao checar status Z-API:",
      error.response?.data || error.message
    );
    return false;
  }
};

module.exports = { enviarZap, verificarStatusZap };
