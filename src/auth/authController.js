const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
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

module.exports = { login };
