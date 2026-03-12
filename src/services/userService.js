const GenericService = require("./genericService");
const User = require("../models/User");
const bcrypt = require("bcryptjs"); // 1. Importar o bcrypt

class UserService extends GenericService {
  constructor(model) {
    super(model);
  }
  async create(dados) {
    const senhaLimpa = dados.password || "123456";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(senhaLimpa, salt);

    dados.password = hash;

    if (dados.senha) delete dados.senha;

    return await super.create(dados);
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
