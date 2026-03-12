const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User"); 
require("dotenv").config();

async function migrarSenhas() {
  await mongoose.connect(process.env.MONGO_URI); // Use sua string de conexão

  const usuarios = await User.find();

  for (let user of usuarios) {
    // Só criptografa se a senha ainda não for um hash (bcrypt hashes começam com $2b$)
    if (!user.password.startsWith("$2b$")) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await user.save();
      console.log(`Senha de ${user.nome} atualizada!`);
    }
  }

  console.log("Migração concluída!");
  process.exit();
}

migrarSenhas();
