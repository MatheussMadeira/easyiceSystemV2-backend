const osService = require("../services/osService");
const User = require("../models/User");
const { Setor, Prioridade } = require("../models/GenericName");
const OrdemServico = require("../models/OrdemServico");

class OSController {
  async create(req, res) {
    console.log("✈️ [CONTROLLER CREATE] Iniciando...");

    try {
      // DEBUG 1: Verificar se o corpo da requisição chegou (pode estar vazio no Render)
      if (!req.body || Object.keys(req.body).length === 0) {
        console.warn("⚠️ [CONTROLLER] ATENÇÃO: req.body chegou VAZIO!");
      } else {
        console.log(
          "📦 [CONTROLLER] req.body recebido:",
          JSON.stringify(req.body, null, 2)
        );
      }

      // DEBUG 2: Verificar arquivos
      console.log(
        "📂 [CONTROLLER] req.files status:",
        req.files ? "Recebeu arquivos" : "Sem arquivos"
      );

      // Chamada do Service
      console.log("🚀 [CONTROLLER] Enviando dados para o Service...");
      const novaOS = await osService.create(req.body, req.files);

      console.log("✅ [CONTROLLER] Service respondeu com SUCESSO");
      return res.status(201).json(novaOS);
    } catch (error) {
      // ISSO AQUI MATA O [OBJECT OBJECT]
      console.error("❌ [CONTROLLER CREATE ERROR]:");
      console.error("Mensagem:", error.message);

      // Se o erro for um objeto estranho do Multer ou do Node, isso aqui abre ele:
      if (typeof error === "object") {
        console.error(
          "Detalhes do objeto de erro:",
          JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        );
      }

      return res.status(400).json({
        erro: error.message || "Erro desconhecido na Controller",
        detalhes: error.stack,
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
