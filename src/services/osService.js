const OrdemServico = require("../models/OrdemServico");
const User = require("../models/User");
const Log = require("../models/Log");
const { Setor, Prioridade } = require("../models/GenericName");

class OSService {
  async getNextNumber() {
    try {
      const ultimaOS = await OrdemServico.findOne({}, { numeroOS: 1 })
        .sort({ numeroOS: -1 })
        .collation({ locale: "en_US", numericOrdering: true });

      if (!ultimaOS || !ultimaOS.numeroOS) {
        return 1000;
      }

      const proximo = Number(ultimaOS.numeroOS) + 1;

      return proximo;
    } catch (error) {
      console.error("### ERRO getNextNumber ###", error.message);
      return 1000;
    }
  }

  async create(dados, arquivos, usuarioNome = "Sistema") {
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
        dataParaConcluir: null,
      };
      const novaOS = await new OrdemServico(novaOSData).save();
      try {
        await Log.create({
          usuario: usuarioNome,
          acao: "CRIAÇÃO",
          entidade: "OS",
          detalhes: `Abriu a nova OS #${novaOS.numeroOS} para o setor ${novaOS.setor}.`,
          registroId: novaOS._id,
        });
      } catch (logError) {
        console.error("⚠️ Falha ao salvar log de criação:", logError.message);
      }
      return novaOS;
    } catch (error) {
      this.logDetailedError("CREATE", error);
      throw error;
    }
  }
  async getOptions() {
    try {
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

      return {
        setores: sDocs.map((d) => d.nome.toUpperCase()),
        solicitantes: solDocs.map((d) => d.nome.toUpperCase()),
        executores: exeDocs.map((d) => d.nome.toUpperCase()),
        prioridades: priDocs.map((d) => d.nome.toUpperCase()),
        situacoes: [
          "EM ABERTO",
          "EM PROCESSO",
          "PRONTO PARA FINALIZAR",
          "CONCLUÍDO",
        ],
      };
    } catch (error) {
      this.logDetailedError("GET_OPTIONS", error);
      throw error;
    }
  }

  async update(id, dados, arquivos, usuarioNome = "Sistema") {
    try {
      const osParaAtualizar = await OrdemServico.findById(id);
      if (!osParaAtualizar) throw new Error("OS não encontrada.");
      if (osParaAtualizar.situacao === "CONCLUÍDO") {
        throw new Error("OS já CONCLUÍDA.");
      }
      let camposParaAtualizar = {
        situacao: dados.situacao,
        executor: dados.executor,
      };
      if (dados.dataPrevista) {
        camposParaAtualizar.dataPrevista = dados.dataPrevista;
      }
      let logMensagem = `Editou a OS #${osParaAtualizar.numeroOS}.`;
      if (dados.situacao && dados.situacao !== osParaAtualizar.situacao) {
        logMensagem = `Alterou status da OS #${osParaAtualizar.numeroOS} de "${osParaAtualizar.situacao}" para "${dados.situacao}".`;
      }
      if (dados.situacao === "EM PROCESSO") {
        camposParaAtualizar.descricaoProcesso = dados.descricaoProcesso;
        camposParaAtualizar.dataFechamento = null;
      } else if (dados.situacao === "PRONTO PARA FINALIZAÇÃO") {
        if (!osParaAtualizar.dataParaConcluir) {
          camposParaAtualizar.dataParaConcluir = new Date();
        }
        camposParaAtualizar.descricaoProcesso = dados.descricaoProcesso;
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

      const osAtualizada = await OrdemServico.findByIdAndUpdate(
        id,
        { $set: camposParaAtualizar },
        {
          returnDocument: "after",
          runValidators: true,
        }
      );

      try {
        await Log.create({
          usuario: usuarioNome,
          acao: "EDIÇÃO",
          entidade: "OS",
          detalhes: logMensagem,
          registroId: id,
        });
      } catch (logError) {
        console.error(
          "⚠️ Falha ao salvar log (OS foi atualizada mesmo assim):",
          logError.message
        );
      }

      return osAtualizada;
    } catch (error) {
      console.error("❌ Erro no processo de Update:", error.message);
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
      const limitDinamico = query.limit ? parseInt(query.limit) : 100;
      const temFiltros = Object.keys(filtros).length > 0;
      const limiteFinal = temFiltros && !query.limit ? 0 : limitDinamico;

      return await OrdemServico.find(filtros)
        .sort({ numeroOS: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(limiteFinal);
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

  async delete(id, usuarioNome = "Sistema") {
    try {
      const osParaDeletar = await OrdemServico.findById(id);

      if (!osParaDeletar) {
        throw new Error("Ordem de Serviço não encontrada.");
      }

      await OrdemServico.findByIdAndDelete(id);

      try {
        await Log.create({
          usuario: usuarioNome,
          acao: "EXCLUSÃO",
          entidade: "OS",
          detalhes: `APAGOU a OS #${osParaDeletar.numeroOS} (Solicitante: ${osParaDeletar.solicitante}).`,
          registroId: id,
        });
      } catch (logError) {
        console.error(
          "⚠️ Erro ao registrar log de exclusão:",
          logError.message
        );
      }

      return { mensagem: "OS removida com sucesso" };
    } catch (error) {
      this.logDetailedError("DELETE", error);
      throw error;
    }
  }
  async updateGeneric(id, dados, usuarioNome = "Sistema") {
    try {
      const osAntiga = await OrdemServico.findById(id);
      if (!osAntiga) throw new Error("OS não encontrada.");

      const atualizado = await OrdemServico.findByIdAndUpdate(
        id,
        { $set: dados },
        { returnDocument: "after", runValidators: true }
      );

      try {
        let detalhesArray = [];

        Object.keys(dados).forEach((campo) => {
          const valorAntigo = osAntiga[campo];
          const valorNovo = dados[campo];

          if (valorAntigo !== valorNovo) {
            detalhesArray.push(
              `${campo}: "${valorAntigo || "Vazio"}" ➔ "${valorNovo}"`
            );
          }
        });

        const mensagemLog =
          detalhesArray.length > 0
            ? `Edição rápida na OS #${
                atualizado.numeroOS
              }: ${detalhesArray.join(" | ")}`
            : `Edição rápida na OS #${atualizado.numeroOS} (sem mudanças de valor).`;

        await Log.create({
          usuario: usuarioNome,
          acao: "EDIÇÃO",
          entidade: "OS",
          detalhes: mensagemLog,
          registroId: id,
        });
      } catch (logError) {
        console.error("⚠️ Erro ao registrar log detalhado:", logError.message);
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
  async updatePecas(numeroOS, dados, usuarioNome = "Sistema") {
    try {
      const { peca, valorPeca, valorMaoDeObra } = dados;

      const atualizado = await OrdemServico.findOneAndUpdate(
        { numeroOS },
        {
          $set: {
            pecasUtilizadas: peca,
            valorPecas: Number(valorPeca),
            valorMaoDeObra: Number(valorMaoDeObra),
          },
        },
        { new: true }
      );

      if (!atualizado) throw new Error("Ordem de Serviço não encontrada.");

      try {
        await Log.create({
          usuario: usuarioNome,
          acao: "EDIÇÃO",
          entidade: "OS",
          detalhes: `Lançou custos na OS #${numeroOS}: Peça ${peca} (R$ ${valorPeca}) + MDO (R$ ${valorMaoDeObra}).`,
          registroId: atualizado._id,
        });
      } catch (logErr) {
        console.error("Erro ao logar peças:", logErr.message);
      }

      return atualizado;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OSService();
