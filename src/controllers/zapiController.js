const { verificarStatusZap } = require("../services/zapiService");

const getStatus = async (req, res) => {
  try {
    const isOnline = await verificarStatusZap();

    return res.json({
      online: isOnline,
      message: isOnline ? "WhatsApp conectado" : "WhatsApp desconectado",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ online: false, error: "Erro ao consultar Z-API" });
  }
};

module.exports = { getStatus };
