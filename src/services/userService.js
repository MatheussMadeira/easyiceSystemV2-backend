const GenericService = require("./genericService");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

class UserService extends GenericService {
  constructor(model) {
    super(model);
  }
  #normalizarUsuario(dados) {
    const camposTexto = ["name", "nome", "role", "setor"];
    camposTexto.forEach((campo) => {
      if (dados[campo] && typeof dados[campo] === "string") {
        dados[campo] = dados[campo]
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/ç/gi, "c")
          .toUpperCase()
          .trim();
      }
    });

    if (dados.email && typeof dados.email === "string") {
      dados.email = dados.email.toLowerCase().trim();
    }

    return dados;
  }
  async create(dados) {
    const dadosLimpos = this.#normalizarUsuario(dados);

    const senhaLimpa = dados.password || "123456";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senhaLimpa, salt);

    dadosLimpos.password = hash;

    if (dadosLimpos.senha) delete dados.senha;

    return await super.create(dadosLimpos);
  }
  async updatePassword(id, senhaAtual, novaSenha) {
    const user = await this.model.findById(id);
    if (!user) throw new Error("Usuário não encontrado.");

    const senhaValida = await bcrypt.compare(senhaAtual, user.password);
    if (!senhaValida) {
      throw new Error("A senha atual está incorreta.");
    }

    const salt = await bcrypt.genSalt(10);
    const novoHash = await bcrypt.hash(novaSenha, salt);

    return await this.model.findByIdAndUpdate(
      id,
      { password: novoHash },
      { new: true }
    );
  }
}

module.exports = new UserService(User);
