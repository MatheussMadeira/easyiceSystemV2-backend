const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { enviarZap } = require("../services/zapiService");
require("dotenv").config();

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const senhaValida = await bcrypt.compare(password, user.password);

    if (!senhaValida) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    if (!user.ativo) return res.status(403).json({ error: "Usuário inativo" });

    const token = jwt.sign(
      { id: user._id, nome: user.nome, funcoes: user.funcoes },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        nome: user.nome,
        email: user.email,
        funcoes: user.funcoes,
        whatsapp: user.whatsapp,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.whatsapp) {
      return res.json({
        message: "Se o e-mail existir, um código será enviado via WhatsApp.",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetCode = code;
    user.resetCodeExpiry = expiry;
    await user.save();

    await enviarZap(
      user.whatsapp,
      `🔐 *EasyIce System*\n\nSeu código de redefinição de senha:\n\n*${code}*\n\n_Válido por 10 minutos. Não compartilhe este código._`
    );

    return res.json({
      message: "Código enviado via WhatsApp!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao processar solicitação." });
  }
}

async function resetPassword(req, res) {
  const { email, code, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ error: "Código inválido ou expirado." });
    }

    if (new Date() > user.resetCodeExpiry) {
      user.resetCode = null;
      user.resetCodeExpiry = null;
      await user.save();
      return res
        .status(400)
        .json({ error: "Código expirado. Solicite um novo." });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ error: "Código incorreto." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetCode = null;
    user.resetCodeExpiry = null;
    await user.save();

    return res.json({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
}

module.exports = { login, forgotPassword, resetPassword };
