const osService = require("../services/osService");
const User = require("../models/User");
const { Setor, Prioridade } = require("../models/GenericName");
class OSController {
  async create(req, res) {
    try {
      const novaOS = await osService.create(req.body, req.files);
      return res.status(201).json(novaOS);
    } catch (error) {
      console.log("DETALHE DO ERRO NO CONTROLLER:", error.message);
      return res.status(400).json({ erro: error.message });
    }
  }

  async read(req, res) {
    try {
      const ordens = await OrdemServico.find().sort({ numeroOS: -1 });

      return res.json(ordens);
    } catch (error) {
      return res.status(500).json({ erro: error.message });
    }
  }
  async updateInline(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;

      const resultado = await osService.updateGeneric(id, dados);

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(500).json({ erro: error.message });
    }
  }
  async findById(req, res) {
    try {
      const os = await osService.findById(req.params.id);
      return res.json(os);
    } catch (error) {
      return res.status(404).json({ erro: error.message });
    }
  }

  async update(req, res) {
    try {
      const osAtualizada = await osService.update(
        req.params.id,
        req.body,
        req.files
      );
      return res.json(osAtualizada);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await osService.delete(id);
      return res.json({ mensagem: "Removida com sucesso!" });
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }
  async getOptions(req, res) {
    try {
      console.log("✈️ Requisição chegou no CONTROLLER de opções");

      // CHAMADA PARA O SERVICE (Onde está a lógica de verdade)
      const options = await osService.getOptions();

      return res.json(options);
    } catch (error) {
      console.error("Erro no Controller getOptions:", error.message);
      return res
        .status(500)
        .json({ erro: "Erro ao carregar opções dinâmicas" });
    }
  }
  async getNext(req, res) {
    try {
      const proximo = await osService.getNextNumber();
      res.json({ proximo });
    } catch (error) {
      res.status(500).json({ erro: error.message });
    }
  }
}

module.exports = new OSController();
