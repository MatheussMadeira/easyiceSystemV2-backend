const equipamentoService = require("../services/equipamentoService");

class EquipamentoController {
  async read(req, res) {
    try {
      const equipamentos = await equipamentoService.read(req.query);
      return res.json(equipamentos);
    } catch (error) {
      console.error("Erro no EquipamentoController.read:", error.message);
      return res.status(500).json({ erro: "Erro ao buscar equipamentos." });
    }
  }

  async create(req, res) {
    try {
      const equipamento = await equipamentoService.create(req.body);
      return res.status(201).json(equipamento);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const equipamento = await equipamentoService.update(id, req.body);
      return res.json(equipamento);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await equipamentoService.delete(id);
      return res.json({ mensagem: "Equipamento removido com sucesso." });
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async insertMany(req, res) {
    try {
      const inseridos = await equipamentoService.insertMany(req.body);
      return res.status(201).json({
        mensagem: `${inseridos.length} equipamentos inseridos com sucesso!`,
      });
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }
}

module.exports = new EquipamentoController();
