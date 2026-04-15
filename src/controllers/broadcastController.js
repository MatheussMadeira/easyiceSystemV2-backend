const User = require("../models/User");
const { enviarZap } = require("../services/zapiService");

const AUTHORIZED_IDS = ["69b3fcd002dc2effde1d3262", "69af974533e5b863bb83a4d7"];

async function sendBroadcast(req, res) {
  try {
    const { message } = req.body;
    const userId = req.user?.id || req.userId;

    if (!AUTHORIZED_IDS.includes(String(userId))) {
      return res
        .status(403)
        .json({ error: "Sem permissão para enviar broadcast." });
    }

    if (!message?.trim()) {
      return res.status(400).json({ error: "Mensagem não pode ser vazia." });
    }

    const users = await User.find({
      ativo: true,
      whatsapp: { $exists: true, $ne: null, $ne: "" },
    }).select("nome whatsapp");

    if (users.length === 0) {
      return res.json({ message: "Nenhum destinatário encontrado.", sent: 0 });
    }

    let sent = 0;
    const errors = [];

    for (const user of users) {
      try {
        const personalizedMessage = message.replace(
          /\{nome\}/gi,
          user.nome?.split(" ")[0] ?? "usuário"
        );

        await enviarZap(user.whatsapp, personalizedMessage);
        sent++;

        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        errors.push({ user: user.nome, error: err.message });
      }
    }

    return res.json({
      message: `Mensagem enviada para ${sent} de ${users.length} destinatários.`,
      sent,
      total: users.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao enviar broadcast." });
  }
}

module.exports = { sendBroadcast };
