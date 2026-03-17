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
      const [proximoEsperado, validacoes] = await Promise.all([
        this.getNextNumber(),
        Promise.all([
          Setor.exists({ nome: dados.setor }),
          User.exists({ nome: dados.solicitante }),
          Prioridade.exists({ nome: dados.prioridade }),
        ]),
      ]);

      const [setorExiste, solicitanteExiste, prioridadeExiste] = validacoes;

      if (!setorExiste) throw new Error(`Setor inválido: ${dados.setor}`);
      if (!solicitanteExiste)
        throw new Error(`Solicitante inválido: ${dados.solicitante}`);
      if (!prioridadeExiste)
        throw new Error(`Prioridade inválida: ${dados.prioridade}`);

      const novaOSData = {
        ...dados,
        numeroOS: proximoEsperado,
        arquivoAbertura: arquivos?.arquivoAbertura?.[0]?.path || null,
        situacao: "EM ABERTO",
        dataAbertura: new Date(),
      };

      return await new OrdemServico(novaOSData).save();
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

  async read(query) {
    try {
      let filtros = {};

      const montarFiltroIn = (valor) => {
        if (!valor || valor === "" || valor === "undefined") return undefined;
        const arr = valor.split(",");
        return { $in: arr };
      };

      const situacao = montarFiltroIn(query.situacao);
      if (situacao) filtros.situacao = situacao;

      const setor = montarFiltroIn(query.setor);
      if (setor) filtros.setor = setor;

      const solicitante = montarFiltroIn(query.solicitante);
      if (solicitante) filtros.solicitante = solicitante;

      const executor = montarFiltroIn(query.executor);
      if (executor) filtros.executor = executor;

      const prioridade = montarFiltroIn(query.prioridade);
      if (prioridade) filtros.prioridade = prioridade;
      if (query.numeroOS) {
        filtros.numeroOS = { $regex: query.numeroOS, $options: "i" };
      }
      if (query.busca) {
        const termo = query.busca;
        filtros.$or = [
          { numeroOS: { $regex: termo, $options: "i" } },
          { equipamento: { $regex: termo, $options: "i" } },
          { solicitante: { $regex: termo, $options: "i" } },
          { descricaoAbertura: { $regex: termo, $options: "i" } },
        ];
      }
      const temFiltros = Object.keys(filtros).length > 0;
      const limite = temFiltros ? 0 : 100;

      console.log("🔍 Filtros aplicados no Mongo:", JSON.stringify(filtros));

      return await OrdemServico.find(filtros)
        .sort({ numeroOS: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(limite);
    } catch (error) {
      console.error("### ERRO NO READ SERVICE ###", error.message);
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
          returnDocument: "after",
          runValidators: true,
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
