const GenericController = require("./genericController");
const userService = require("../services/userService");

class UserController extends GenericController {
  constructor() {
    super(userService);
  }

  
  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { senhaAtual, novaSenha } = req.body; 

      if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ erro: "Preencha todos os campos." });
      }

      await this.service.updatePassword(id, senhaAtual, novaSenha);
      return res.json({ mensagem: "Senha atualizada com sucesso!" });
    } catch (error) {
      
      return res.status(400).json({ erro: error.message });
    }
  }
}

module.exports = new UserController();
