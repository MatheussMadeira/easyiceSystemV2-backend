const axios = require("axios");
require("dotenv").config();

const listarGruposDebug = async () => {
  const url = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_INSTANCE_TOKEN}/chats`;

  try {
    const response = await axios.get(url, {
      headers: { "client-token": process.env.ZAPI_CLIENT_TOKEN },
    });

    if (response.data.length > 0) {
      console.log("--- ESTRUTURA DO PRIMEIRO CHAT ---");
      // Isso aqui vai mostrar todas as chaves disponíveis
      console.log(JSON.stringify(response.data[0], null, 2));

      const grupos = response.data
        .filter((chat) => chat.isGroup)
        .map((g) => ({
          nome: g.name || g.nameChat,
          // Tente g.phone se g.id deu undefined
          id: g.id || g.phone || g.jid,
        }));

      console.log("\n--- LISTA DE GRUPOS ---");
      console.table(grupos);
    }
  } catch (error) {
    console.error("Erro:", error.response?.data || error.message);
  }
};

listarGruposDebug();
