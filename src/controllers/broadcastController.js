const User = require("../models/User");
const { enviarZap } = require("../services/zapiService");

const AUTHORIZED_IDS = ["69b3fcd002dc2effde1d3262", "69af974533e5b863bb83a4d7"];

async function sendBroadcast(req, res) {
  console.log("🔥 BROADCAST CHAMADO!");
  console.log("Usuario:", req.usuario);
  const { message } = req.body;

  const userId = String(req.usuario?.id || req.usuario?._id);

  if (!AUTHORIZED_IDS.includes(userId)) {
    return res
      .status(403)
      .json({ error: "Sem permissão para enviar broadcast." });
  }

  if (!message?.trim()) {
    return res.status(400).json({ error: "Mensagem vazia." });
  }

  const users = await User.find({
    ativo: true,
    whatsapp: { $exists: true, $ne: null, $ne: "" },
  }).select("nome whatsapp");

  if (users.length === 0) {
    return res.json({ message: "Nenhum destinatário encontrado.", sent: 0 });
  }

  res.json({
    message: `Enviando para ${users.length} destinatário(s)...`,
    total: users.length,
  });

  (async () => {
    try {
      await enviarZap(
        process.env.ZAPI_GROUP_ABERTURA,
        message.replace(/\{nome\}/gi, "todos")
      );
    } catch (err) {
      console.error("❌ Erro ao enviar para grupo:", err.message);
    }
    let sent = 0;
    for (const user of users) {
      try {
        const msg = message.replace(
          /\{nome\}/gi,
          user.nome?.split(" ")[0] ?? "usuário"
        );
        await enviarZap(user.whatsapp, msg);
        sent++;
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`❌ Erro ao enviar para ${user.nome}:`, err.message);
      }
    }
    console.log(`✅ Broadcast finalizado: ${sent}/${users.length} enviados.`);
  })();
}

module.exports = { sendBroadcast };
