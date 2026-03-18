const osService = require("../services/osService");
const User = require("../models/User");
const { Setor, Prioridade } = require("../models/GenericName");
const OrdemServico = require("../models/OrdemServico");

class OSController {
  async create(req, res) {
    try {
      const usuarioLogado = req.usuario?.nome || "Sistema";
      const novaOS = await osService.create(req.body, req.files, usuarioLogado);

      return res.status(201).json(novaOS);
    } catch (error) {
      console.error("❌ [CONTROLLER CREATE ERROR]:", error.message);

      return res.status(400).json({
        erro: error.message || "Erro ao criar Ordem de Serviço",
      });
    }
  }

  async read(req, res) {
    try {
      const filtrosDaUrl = req.query;
      const ordens = await osService.read(filtrosDaUrl);

      return res.json(ordens);
    } catch (error) {
      console.error("Erro no GET OS:", error);
      return res.status(500).json({ erro: error.message });
    }
  }
  async updateInline(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;
      const usuarioLogado = req.usuario?.nome || "Sistema";

      const resultado = await osService.updateGeneric(id, dados, usuarioLogado);

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
      const usuarioLogado = req.usuario?.nome || "Sistema";
      const osAtualizada = await osService.update(
        req.params.id,
        req.body,
        req.files,
        usuarioLogado
      );
      return res.json(osAtualizada);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.usuario?.nome || "Sistema";

      await osService.delete(id, usuarioLogado);

      return res.status(200).json({ mensagem: "Removido com sucesso" });
    } catch (error) {
      return res.status(500).json({ erro: error.message });
    }
  }
  async getOptions(req, res) {
    try {
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
  async lancarPecas(req, res) {
    try {
      const { numeroOS } = req.params;
      const usuarioLogado = req.usuario?.nome || "Sistema";

      const resultado = await osService.updatePecas(
        numeroOS,
        req.body,
        usuarioLogado
      );

      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }
}

module.exports = new OSController();
