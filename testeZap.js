require("dotenv").config();
const axios = require("axios");

async function testarEnvio() {
  const url = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_INSTANCE_TOKEN}/send-text`;

  try {
    const response = await axios.post(
      url,
      {
        phone: "5531996193940",
        message: "Agora foi, Matheus! Z-API configurada com sucesso. 🚀",
      },
      {
        headers: {
          "client-token": process.env.ZAPI_CLIENT_TOKEN,
        },
      }
    );

    console.log("✅ SUCESSO:", response.data);
  } catch (error) {
    console.error(
      "❌ ERRO:",
      error.response ? error.response.data : error.message
    );
  }
}

testarEnvio();
