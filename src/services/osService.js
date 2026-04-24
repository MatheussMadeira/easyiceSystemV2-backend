const OrdemServico = require("../models/OrdemServico");
const User = require("../models/User");
const Log = require("../models/Log");
const { Setor, Prioridade } = require("../models/GenericName");
const { enviarZap } = require("../services/zapiService");
const ServicoFrequente = require("../models/ServicoFrequente");
const enviarZapGroup = (destino, texto) => {
  if (process.env.DISABLE_ZAP_GROUP === "true") {
    console.log(`📵 [TESTE] Mensagem suprimida para grupo: ${destino}`);
    return;
  }
  enviarZap(destino, texto);
};
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
  async criarOSAutomatica(servico) {
    try {
      const numeroOS = await this.getNextNumber();

      const novaOS = await new OrdemServico({
        numeroOS,
        dataAbertura: new Date(),
        setor: servico.setor,
        equipamento: servico.equipamento,
        solicitante: servico.solicitantePadrao,
        executor: servico.executorPadrao,
        prioridade: servico.prioridade || "Normal",
        situacao: "EM ABERTO",
        descricaoAbertura:
          servico.descricao || `Manutenção preventiva: ${servico.nome}`,
        tipo: "PREVENTIVA",
        servicoFrequenteId: servico._id,
      }).save();

      const novaProxima = new Date();
      novaProxima.setDate(novaProxima.getDate() + servico.periodicidadeDias);

      await ServicoFrequente.findByIdAndUpdate(servico._id, {
        ultimaExecucao: new Date(),
        proximaExecucao: novaProxima,
      });

      const agora = new Date();
      const texto =
        `🔄 *OS PREVENTIVA - #${novaOS.numeroOS}* 🔄\n\n` +
        `📋 *SERVIÇO:* ${servico.nome}\n` +
        `📍 *SETOR:* ${novaOS.setor}\n` +
        `⚙️ *EQUIPAMENTO:* ${novaOS.equipamento}\n` +
        `🛠️ *EXECUTOR:* ${novaOS.executor}\n` +
        `📅 *DATA:* ${agora.toLocaleDateString("pt-BR")}\n` +
        `🔁 *PERIODICIDADE:* A cada ${servico.periodicidadeDias} dias`;

      enviarZapGroup(process.env.ZAPI_GROUP_ABERTURA, texto);

      const executorDoc = await User.findOne({ nome: novaOS.executor });
      if (executorDoc?.whatsapp) {
        enviarZap(executorDoc.whatsapp, texto);
      }

      await Log.create({
        usuario: "Sistema",
        acao: "CRIAÇÃO AUTOMÁTICA",
        entidade: "OS",
        detalhes: `OS preventiva #${novaOS.numeroOS} criada automaticamente pelo serviço "${servico.nome}".`,
        registroId: novaOS._id,
      });

      console.log(
        `✅ OS preventiva #${novaOS.numeroOS} criada para: ${servico.nome}`
      );
      return novaOS;
    } catch (error) {
      console.error(
        `❌ Erro ao criar OS automática para ${servico.nome}:`,
        error.message
      );
      throw error;
    }
  }
  async processarServicosFrequentes() {
    const agora = new Date();
    const servicos = await ServicoFrequente.find({
      ativo: true,
      proximaExecucao: { $lte: agora },
    });

    for (const servico of servicos) {
      const osAberta = await OrdemServico.findOne({
        servicoFrequenteId: servico._id,
        situacao: {
          $in: ["EM ABERTO", "EM PROCESSO", "PRONTO PARA FINALIZAÇÃO"],
        },
      });

      if (osAberta) {
        console.log(
          `⏭️ Pulando "${servico.nome}" — OS #${osAberta.numeroOS} ainda pendente`
        );
        continue;
      }

      try {
        await this.criarOSAutomatica(servico);
      } catch (err) {
        console.error(`❌ Erro ao criar OS para ${servico.nome}:`, err.message);
      }
    }
  }
  async create(dados, arquivos, usuarioNome = "Sistema", userRoles = []) {
    try {
      const eAdmin = userRoles.includes("ADMIN");
      const solicitanteFinal = eAdmin ? dados.solicitante : usuarioNome;
      const [proximoEsperado, validacoes] = await Promise.all([
        this.getNextNumber(),
        Promise.all([
          Setor.exists({ nome: dados.setor }),
          User.exists({ nome: solicitanteFinal }),
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
        solicitante: solicitanteFinal,
        numeroOS: proximoEsperado,
        arquivoAbertura: arquivos?.arquivoAbertura?.[0]?.path || null,
        situacao: "EM ABERTO",
        dataAbertura: new Date(),
        dataParaConcluir: null,
      };

      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString("pt-BR");
      const horaFormatada = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      const novaOS = await new OrdemServico(novaOSData).save();
      const prioridadeCurta = novaOS.prioridade.toUpperCase();
      const linkFoto = novaOS.arquivoAbertura
        ? `\n🖼️ *FOTO DO PROBLEMA:* ${novaOS.arquivoAbertura}`
        : "";
      const texto =
        novaOS.tipo === "PREVENTIVA"
          ? `🔄 *NOVA OS PREVENTIVA - #${novaOS.numeroOS}* 🔄\n\n` +
            `📋 *SERVIÇO:* ${dados.nomeServico || "Manutenção Preventiva"}\n` +
            `🔥 *PRIORIDADE:* ${prioridadeCurta}\n` +
            `----------------------------------\n` +
            `📍 *SETOR:* ${novaOS.setor}\n` +
            `👤 *SOLICITANTE:* ${novaOS.solicitante}\n` +
            `🛠️ *EXECUTOR:* ${novaOS.executor || "A DEFINIR"}\n` +
            `⚙️ *EQUIPAMENTO:* ${novaOS.equipamento}\n\n` +
            `📝 *DESCRIÇÃO:* \n${novaOS.descricaoAbertura}\n` +
            `----------------------------------\n` +
            `🔁 *PERIODICIDADE:* A cada ${dados.periodicidadeDias} dias\n` +
            `📅 *DATA:* ${dataFormatada} às ${horaFormatada}`
          : `🚨 *NOVA ORDEM DE SERVIÇO - #${novaOS.numeroOS}* 🚨\n\n` +
            `🔥 *PRIORIDADE:* ${prioridadeCurta}\n` +
            `----------------------------------\n` +
            `📍 *SETOR:* ${novaOS.setor}\n` +
            `👤 *SOLICITANTE:* ${novaOS.solicitante}\n` +
            `🛠️ *EXECUTOR:* ${novaOS.executor || "A DEFINIR"}\n` +
            `⚙️ *EQUIPAMENTO:* ${novaOS.equipamento}\n\n` +
            `📝 *DESCRIÇÃO DO PROBLEMA:* \n${novaOS.descricaoAbertura}\n` +
            `----------------------------------` +
            linkFoto +
            `\n\n` +
            `📅 *DATA:* ${dataFormatada} às ${horaFormatada}`;

      enviarZapGroup(process.env.ZAPI_GROUP_ABERTURA, texto);

      const executorDoc = await User.findOne({ nome: novaOS.executor });
      if (executorDoc?.whatsapp) {
        enviarZap(executorDoc.whatsapp, texto);
      }
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
          "PRONTO PARA FINALIZAÇÃO",
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
      if (dados.valorMaoDeObra !== undefined) {
        const vInterna = Number(dados.valorMaoDeObra) || 0;
        camposParaAtualizar.valorMaoDeObra = vInterna;
        if (vInterna > 0) camposParaAtualizar.valorMaoDeObraExterna = 0;
      }

      if (dados.valorMaoDeObraExterna !== undefined) {
        const vExterna = Number(dados.valorMaoDeObraExterna) || 0;
        camposParaAtualizar.valorMaoDeObraExterna = vExterna;
        if (vExterna > 0) camposParaAtualizar.valorMaoDeObra = 0;
      }
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

        if (
          osParaAtualizar.situacao === "PRONTO PARA FINALIZAÇÃO" &&
          dados.motivoRejeicao
        ) {
          camposParaAtualizar.motivoRejeicao = dados.motivoRejeicao;
        }
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
        if (
          dados.situacao === "EM PROCESSO" &&
          osParaAtualizar.situacao === "PRONTO PARA FINALIZAÇÃO" &&
          dados.motivoRejeicao
        ) {
          const executorDoc = await User.findOne({
            nome: osAtualizada.executor,
          });
          if (executorDoc?.whatsapp) {
            const msgRejeicao =
              `❌ *OS #${osAtualizada.numeroOS} FOI DEVOLVIDA PARA REEXECUÇÃO* ❌\n\n` +
              `👤 *SOLICITANTE:* ${osAtualizada.solicitante}\n` +
              `⚙️ *EQUIPAMENTO:* ${osAtualizada.equipamento}\n` +
              `📍 *SETOR:* ${osAtualizada.setor}\n` +
              `----------------------------------\n` +
              `💬 *MOTIVO DA DEVOLUÇÃO:*\n${dados.motivoRejeicao}\n\n` +
              `👉 Por favor, verifique o serviço e atualize a OS novamente.`;

            enviarZap(executorDoc.whatsapp, msgRejeicao);
          }
        }
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

      const solicitanteDoc = await User.findOne({
        nome: osAtualizada.solicitante,
      });
      const foneSolicitante = solicitanteDoc?.whatsapp;

      if (
        dados.situacao === "EM PROCESSO" &&
        osParaAtualizar.situacao !== "EM PROCESSO"
      ) {
        const dataFormatada = dados.dataPrevista
          ? new Date(dados.dataPrevista).toLocaleDateString("pt-BR", {
              timeZone: "UTC",
            })
          : "Não informada";

        const msgProcesso =
          `👨‍🔧 *SUA OS #${osAtualizada.numeroOS} ESTÁ EM PROCESSO* \n\n` +
          `🛠️ *TÉCNICO:* ${osAtualizada.executor}\n` +
          `⚙️ *EQUIPAMENTO:* ${osAtualizada.equipamento}\n` +
          `📅 *PREVISÃO DE ENTREGA:* ${dataFormatada}\n` +
          `📝 *PROBLEMA INICIAL:* \n${osAtualizada.descricaoAbertura}\n` +
          `----------------------------------\n` +
          `💬 *OBSERVAÇÕES:* ${
            dados.descricaoProcesso || "Equipamento em análise técnica."
          }`;
        if (foneSolicitante) enviarZap(foneSolicitante, msgProcesso);
      }
      if (
        dados.situacao === "PRONTO PARA FINALIZAÇÃO" &&
        osParaAtualizar.situacao !== "PRONTO PARA FINALIZAÇÃO"
      ) {
        const msgPronto =
          `✅ *SUA OS #${osAtualizada.numeroOS} ESTÁ PRONTA PARA CONFERÊNCIA* 🛠️\n\n` +
          `👤 *EXECUTOR:* ${osAtualizada.executor}\n` +
          `📝 *PROBLEMA RESOLVIDO:* \n${osAtualizada.descricaoAbertura}\n` +
          `⚙️ *EQUIPAMENTO:* ${osAtualizada.equipamento}\n` +
          `----------------------------------\n` +
          `📝 *STATUS:* O serviço foi concluído e os custos foram lançados.\n\n` +
          `👉 *POR FAVOR:* Acesse o sistema para conferir os valores e finalizar a ordem.`;
        if (foneSolicitante) enviarZap(foneSolicitante, msgPronto);
      }
      if (
        dados.situacao === "CONCLUÍDO" &&
        osParaAtualizar.situacao !== "CONCLUÍDO"
      ) {
        const agoraFinalizada = new Date();
        const dataFinalizada = agoraFinalizada.toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        });
        const horaFinalizada = agoraFinalizada.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/Sao_Paulo",
        });
        const total =
          (Number(osAtualizada.valorPecas) || 0) +
          (Number(osAtualizada.valorMaoDeObra) || 0) +
          (Number(osAtualizada.valorMaoDeObraExterna) || 0);
        const tipoMdoTexto =
          osAtualizada.valorMaoDeObraExterna > 0
            ? "Externa (Terceirizado)"
            : "Interna";
        const msgFinalizada =
          `✅ *ORDEM DE SERVIÇO FINALIZADA - #${osAtualizada.numeroOS}* ✅\n\n` +
          `⚙️ *EQUIPAMENTO:* ${osAtualizada.equipamento}\n` +
          `----------------------------------\n` +
          `🛠️ *EXECUTOR:* ${osAtualizada.executor}\n` +
          `👤 *SOLICITANTE:* ${osAtualizada.solicitante}\n` +
          `📦 *PEÇAS UTILIZADAS:* ${dados.pecasUtilizadas || "Nenhuma"}\n\n` +
          `🔧 *TIPO MÃO DE OBRA:* ${tipoMdoTexto}\n\n` +
          `💰 *VALOR TOTAL:* R$ ${total.toFixed(2)}\n` +
          `📝 *RELATÓRIO TÉCNICO:* \n${
            dados.descricaoFechamento ||
            "Serviço concluído conforme solicitado."
          }\n` +
          `----------------------------------` +
          (osAtualizada.arquivoFechamento
            ? `\n🖼️ *Link da Foto:* ${osAtualizada.arquivoFechamento}`
            : "") +
          `\n\n📅 *FINALIZADA EM:* ${dataFinalizada} às ${horaFinalizada}`;

        enviarZapGroup(process.env.ZAPI_GROUP_FECHAMENTO, msgFinalizada);
        if (
          osParaAtualizar.tipo === "PREVENTIVA" ||
          osParaAtualizar.servicoFrequenteId
        ) {
          console.log(
            `🔄 OS preventiva #${osAtualizada.numeroOS} concluída — verificando próxima criação...`
          );
          this.processarServicosFrequentes().catch((err) =>
            console.error(
              "⚠️ Erro ao processar serviços após conclusão:",
              err.message
            )
          );
        }
      }
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
      if (query.dataInicio || query.dataFim) {
        filtros.createdAt = {};

        if (query.dataInicio) {
          filtros.createdAt.$gte = new Date(query.dataInicio);
        }

        if (query.dataFim) {
          const fimDoDia = new Date(query.dataFim);
          fimDoDia.setHours(23, 59, 59, 999);
          filtros.createdAt.$lte = fimDoDia;
        }
      }
      const limitDinamico = query.limit ? parseInt(query.limit) : 150000;
      const temFiltros = Object.keys(filtros).length > 0;
      const limiteFinal = temFiltros && !query.limit ? 0 : limitDinamico;
      if (query.tipo) filtros.tipo = query.tipo;
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
