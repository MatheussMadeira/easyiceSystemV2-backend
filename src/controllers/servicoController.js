const Service = require("../services/servicoService");
const LogServico = require("../models/LogServico");

class ServicoFrequenteController {
  async store(req, res) {
    try {
      const novo = await Service.create(req.body);
      return res.status(201).json(novo);
    } catch (err) {
      return res.status(400).json({ erro: err.message });
    }
  }

  async index(req, res) {
    try {
      const lista = await Service.getAll();
      return res.json(lista);
    } catch (err) {
      return res
        .status(500)
        .json({ erro: "Erro ao buscar serviços frequentes." });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const atualizado = await Service.update(id, req.body);
      return res.json(atualizado);
    } catch (err) {
      return res.status(400).json({ erro: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await Service.delete(id);
      return res.status(204).send();
    } catch (err) {
      return res.status(400).json({ erro: "Erro ao deletar serviço." });
    }
  }

  async registrarExecucao(req, res) {
    try {
      const { id } = req.params;
      const resultado = await Service.registrarExecucao(id);
      return res.json(resultado);
    } catch (error) {
      return res.status(500).json({ erro: error.message });
    }
  }
  async buscarLogs(req, res) {
    const logs = await LogServico.find().sort({ dataExecucao: -1 }).limit(100);
    return res.json(logs);
  }
}

module.exports = new ServicoFrequenteController();
