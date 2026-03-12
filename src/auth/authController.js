const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // 1. Importe o bcrypt
require("dotenv").config();

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // 2. Verifica se o usuário existe
    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    // 3. Compara a senha digitada com o Hash do banco
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
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

module.exports = { login };
