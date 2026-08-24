const osService = require("../services/osService");
const User = require("../models/User");
const { Setor, Prioridade } = require("../models/GenericName");
const ServicoFrequente = require("../models/ServicoFrequente");
const OrdemServico = require("../models/OrdemServico");

class OSController {
  async create(req, res) {
    try {
      const usuarioLogado = req.usuario?.nome || "Sistema";
      const funcoesUsuario = req.usuario?.funcoes || [];

      if (req.body.tipo === "PREVENTIVA" && req.body.periodicidadeDias) {
        const novaOS = await osService.create(
          req.body,
          req.files,
          usuarioLogado,
          funcoesUsuario
        );
        const proxima = osService._agendarProximaExecucao(
          new Date(),
          req.body.periodicidadeDias
        );

        const servicoFrequente = await ServicoFrequente.create({
          nome: req.body.nomeServico || `Preventiva - ${req.body.equipamento}`,
          descricao: req.body.descricaoAbertura,
          setor: req.body.setor,
          equipamento: req.body.equipamento,
          solicitantePadrao: novaOS.solicitante,
          executorPadrao: req.body.executor || "Não Atribuído",
          prioridade: req.body.prioridade || "Normal",
          periodicidadeDias: Number(req.body.periodicidadeDias),
          ultimaExecucao: new Date(),
          proximaExecucao: proxima,
          tempoExecucao: Number(req.body.tempoExecucao) || 1,
          ativo: true,
        });

        await OrdemServico.findByIdAndUpdate(novaOS._id, {
          servicoFrequenteId: servicoFrequente._id,
        });

        return res.status(201).json(novaOS);
      }

      const novaOS = await osService.create(
        req.body,
        req.files,
        usuarioLogado,
        funcoesUsuario
      );
      return res.status(201).json(novaOS);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
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
      console.error("❌ Erro no Controller:", error.message);
      return res.status(400).json({ erro: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const usuarioLogado = req.usuario?.nome || "Sistema";
      const forcar = req.query.forcar === "true";

      await osService.delete(id, usuarioLogado, { forcar });

      return res.status(200).json({ mensagem: "Removido com sucesso" });
    } catch (error) {
      if (error.code === "PREVENTIVA_PENDENTE") {
        return res.status(409).json({ erro: error.message, podeForcar: true });
      }
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
