const GenericController = require("./genericController");
const userService = require("../services/userService");

class UserController extends GenericController {
  constructor() {
    super(userService);
  }

  // Método específico para tratar a requisição de senha
  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { senhaAtual, novaSenha } = req.body; // Recebe os dois campos

      if (!senhaAtual || !novaSenha) {
        return res.status(400).json({ erro: "Preencha todos os campos." });
      }

      await this.service.updatePassword(id, senhaAtual, novaSenha);
      return res.json({ mensagem: "Senha atualizada com sucesso!" });
    } catch (error) {
      // O erro "A senha atual está incorreta" cairá aqui
      return res.status(400).json({ erro: error.message });
    }
  }
}

module.exports = new UserController();
