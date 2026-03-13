const OrdemServico = require("../models/OrdemServico");
const User = require("../models/User");
const { Setor, Prioridade } = require("../models/GenericName");

class OSService {
  // Busca o próximo número baseado na última OS
  async getNextNumber() {
    try {
      console.log(
        "--- [DEBUG getNextNumber] Iniciando busca do último número ---"
      );
      const ultimaOS = await OrdemServico.findOne({}, { numeroOS: 1 })
        .sort({ numeroOS: -1 })
        .collation({ locale: "en_US", numericOrdering: true });

      if (!ultimaOS || !ultimaOS.numeroOS) {
        console.log(
          "[DEBUG getNextNumber] Nenhuma OS encontrada, retornando 1000"
        );
        return 1000;
      }

      const proximo = Number(ultimaOS.numeroOS) + 1;
      console.log(
        `[DEBUG getNextNumber] Última OS: ${ultimaOS.numeroOS}, Próximo sugerido: ${proximo}`
      );
      return proximo;
    } catch (error) {
      console.error("### ERRO getNextNumber ###", error.message);
      return 1000;
    }
  }

  async create(dados, arquivos) {
    try {
      console.log(
        "--- [DEBUG CREATE] Payload recebido ---",
        JSON.stringify(dados, null, 2)
      );

      const proximoEsperado = await this.getNextNumber();

      const [
        setorMestre,
        setorHist,
        solicitanteMestre,
        solicitanteHist,
        prioridadeMestre,
        prioridadeHist,
      ] = await Promise.all([
        Setor.findOne({ nome: dados.setor }),
        OrdemServico.findOne({ setor: dados.setor }),
        User.findOne({ nome: dados.solicitante }),
        OrdemServico.findOne({ solicitante: dados.solicitante }),
        Prioridade.findOne({ nome: dados.prioridade }),
        OrdemServico.findOne({ prioridade: dados.prioridade }),
      ]);

      console.log("[DEBUG CREATE] Verificação de integridade:", {
        setor: !!(setorMestre || setorHist),
        solicitante: !!(solicitanteMestre || solicitanteHist),
        prioridade: !!(prioridadeMestre || prioridadeHist),
      });

      if (!setorMestre && !setorHist)
        throw new Error(`Setor inválido: ${dados.setor}`);
      if (!solicitanteMestre && !solicitanteHist)
        throw new Error(`Solicitante inválido: ${dados.solicitante}`);
      if (!prioridadeMestre && !prioridadeHist)
        throw new Error(`Prioridade inválida: ${dados.prioridade}`);

      const novaOSData = {
        ...dados,
        numeroOS: proximoEsperado,
        arquivoAbertura: arquivos?.arquivoAbertura?.[0]?.path || null,
        situacao: "EM ABERTO",
        dataAbertura: new Date(),
      };

      console.log(
        "[DEBUG CREATE] Tentando salvar objeto final:",
        JSON.stringify(novaOSData, null, 2)
      );
      const novaOS = new OrdemServico(novaOSData);
      const salvo = await novaOS.save();

      console.log("--- [DEBUG CREATE] SUCESSO! OS Gerada:", salvo.numeroOS);
      return salvo;
    } catch (error) {
      this.logDetailedError("CREATE", error);
      throw error;
    }
  }

  async getOptions() {
    try {
      console.log("--- [DEBUG getOptions] Iniciando consulta de listas ---");
      const [sDocs, solDocs, exeDocs, priDocs] = await Promise.all([
        Setor.find({}, "nome").sort({ nome: 1 }),
        User.find(
          { funcoes: { $in: ["SOLICITANTE", "ADMIN"] }, ativo: true },
          "nome"
        ).sort({ nome: 1 }),
        User.find(
          { funcoes: { $in: ["EXECUTOR", "ADMIN"] }, ativo: true },
          "nome"
        ).sort({ nome: 1 }),
        Prioridade.find({}, "nome").sort({ nome: 1 }),
      ]);

      console.log(
        `[DEBUG getOptions] Retornando: ${sDocs.length} setores, ${solDocs.length} usuários.`
      );
      return {
        setores: sDocs.map((d) => d.nome.toUpperCase()),
        solicitantes: solDocs.map((d) => d.nome.toUpperCase()),
        executores: exeDocs.map((d) => d.nome.toUpperCase()),
        prioridades: priDocs.map((d) => d.nome.toUpperCase()),
        situacoes: ["EM ABERTO", "EM PROCESSO", "CONCLUÍDO", "CANCELADA"],
      };
    } catch (error) {
      this.logDetailedError("GET_OPTIONS", error);
      throw error;
    }
  }

  async update(id, dados, arquivos) {
    try {
      console.log(`--- [DEBUG UPDATE] Atualizando OS ID: ${id} ---`);
      const osParaAtualizar = await OrdemServico.findById(id);
      if (!osParaAtualizar) throw new Error("OS não encontrada.");

      if (osParaAtualizar.situacao === "CONCLUÍDO")
        throw new Error("OS já CONCLUÍDA.");

      let camposParaAtualizar = {
        situacao: dados.situacao,
        executor: dados.executor,
      };

      if (dados.situacao === "EM PROCESSO") {
        camposParaAtualizar.descricaoProcesso = dados.descricaoProcesso;
        camposParaAtualizar.dataFechamento = null;
      } else if (dados.situacao === "CONCLUÍDO") {
        camposParaAtualizar = {
          ...camposParaAtualizar,
          dataFechamento: new Date(),
          pecasUtilizadas: dados.pecasUtilizadas || "Nenhuma",
          descricaoFechamento: dados.descricaoFechamento,
          valorPecas: Number(dados.valorPecas) || 0,
        };

        if (arquivos?.arquivoFechamento?.[0]?.path) {
          camposParaAtualizar.arquivoFechamento =
            arquivos.arquivoFechamento[0].path;
        }
      }

      console.log(
        "[DEBUG UPDATE] Campos a aplicar:",
        JSON.stringify(camposParaAtualizar, null, 2)
      );
      return await OrdemServico.findByIdAndUpdate(
        id,
        { $set: camposParaAtualizar },
        { new: true, runValidators: true }
      );
    } catch (error) {
      this.logDetailedError("UPDATE", error);
      throw error;
    }
  }

  async read() {
    try {
      return await OrdemServico.find()
        .sort({ numeroOS: -1 })
        .collation({ locale: "en_US", numericOrdering: true });
    } catch (error) {
      console.error("### ERRO READ ###", error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      const os = await OrdemServico.findById(id);
      if (!os) throw new Error("OS não encontrada.");
      return os;
    } catch (error) {
      this.logDetailedError("FINDBYID", error);
      throw error;
    }
  }

  async delete(id) {
    try {
      console.log(`--- [DEBUG DELETE] Removendo OS ID: ${id} ---`);
      const deletada = await OrdemServico.findByIdAndDelete(id);
      if (!deletada) throw new Error("OS não encontrada");
      return deletada;
    } catch (error) {
      this.logDetailedError("DELETE", error);
      throw error;
    }
  }
  async updateGeneric(id, dados) {
    try {
      console.log(
        `--- [DEBUG updateGeneric] Iniciando atualização genérica ---`
      );
      console.log(`ID alvo: ${id}`);
      console.log(`Dados para injeção:`, JSON.stringify(dados, null, 2));

      const atualizado = await OrdemServico.findByIdAndUpdate(
        id,
        { $set: dados },
        {
          returnDocument: "after", // Retorna o doc atualizado
          runValidators: true, // Garante que o Mongoose valide os campos novos
        }
      );

      if (!atualizado) {
        console.warn(
          `[DEBUG updateGeneric] Nenhuma OS encontrada para o ID: ${id}`
        );
      } else {
        console.log(`[DEBUG updateGeneric] OS atualizada com sucesso!`);
      }

      return atualizado;
    } catch (error) {
      this.logDetailedError("UPDATE_GENERIC", error);
      throw error;
    }
  }
  // Função Auxiliar de Log para evitar o [object Object]
  logDetailedError(metodo, error) {
    console.error(`### [ERRO FATAL] Método: ${metodo} ###`);
    console.error("Mensagem:", error.message);
    if (error.errors) {
      console.error(
        "Erros de Validação (Mongoose):",
        JSON.stringify(error.errors, null, 2)
      );
    }
    if (error.stack) {
      console.error("Stack Trace:", error.stack);
    }
  }
}

module.exports = new OSService();
