const GenericService = require("./genericService");
const User = require("../models/User"); 

class UserService extends GenericService {
  constructor(model) {
    super(model);
  }
  async create(dados) {
    if (!dados.senha) dados.senha = "123456";
    return await super.create(dados);
  }
}

// Exportamos apenas uma instância do serviço de usuário
module.exports = new UserService(User);
