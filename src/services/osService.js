const OrdemServico = require("../models/OrdemServico");

class OSService {
  async getNextNumber() {
    try {
      const ultimaOS = await OrdemServico.findOne({}, { numeroOS: 1 })
        .sort({ numeroOS: -1 })
        .collation({ locale: "en_US", numericOrdering: true });

      if (!ultimaOS || !ultimaOS.numeroOS) {
        return 1000;
      }

      const numeroAtual = Number(ultimaOS.numeroOS);

      return numeroAtual + 1;
    } catch (error) {
      console.error("Erro ao buscar próximo número:", error);
      return 1000;
    }
  }
  async updateGeneric(id, dados) {
    try {
      const osAtualizada = await OrdemServico.findByIdAndUpdate(
        id,
        { $set: dados },
        { returnDocument: "after", runValidators: true }
      );

      if (!osAtualizada) {
        throw new Error("Ordem de Serviço não encontrada.");
      }

      return osAtualizada;
    } catch (error) {
      console.error("Erro no updateGeneric:", error);
      throw error;
    }
  }
  async create(dados, arquivos) {
    try {
      const proximoEsperado = await this.getNextNumber();

      const [setores, solicitantes, prioridades] = await Promise.all([
        OrdemServico.distinct("setor"),
        OrdemServico.distinct("solicitante"),
        OrdemServico.distinct("prioridade"),
      ]);

      if (!setores.includes(dados.setor)) throw new Error(`Setor inválido.`);
      if (!solicitantes.includes(dados.solicitante))
        throw new Error(`Solicitante inválido.`);
      if (!prioridades.includes(dados.prioridade))
        throw new Error(`Prioridade inválida.`);
      const novaOSData = {
        ...dados,
        numeroOS: proximoEsperado,
        arquivoAbertura: arquivos?.arquivoAbertura?.[0]?.path || null,
        situacao: "EM ABERTO",
        dataAbertura: new Date(),
      };

      const novaOS = new OrdemServico(novaOSData);
      return await novaOS.save();
    } catch (error) {
      throw error;
    }
  }
  async update(id, dadosFechamento, arquivos) {
    try {
      const osParaFechar = await OrdemServico.findById(id);

      if (!osParaFechar) throw new Error("OS não encontrada.");

      if (osParaFechar.situacao === "CONCLUÍDO") {
        throw new Error("Esta Ordem de Serviço já se encontra CONCLUÍDA.");
      }

      const camposParaAtualizar = {
        situacao: "CONCLUÍDO",
        dataFechamento: new Date(),
        pecasUtilizadas: dadosFechamento.pecasUtilizadas,
        descricaoFechamento: dadosFechamento.descricaoFechamento,
        valorPecas: Number(dadosFechamento.valorPecas) || 0,
        executor: dadosFechamento.executor,
      };

      if (arquivos?.arquivoFechamento?.[0]?.path) {
        camposParaAtualizar.arquivoFechamento =
          arquivos.arquivoFechamento[0].path;
      }
      return await OrdemServico.findByIdAndUpdate(id, camposParaAtualizar, {
        new: true,
      });
    } catch (error) {
      throw error;
    }
  }
  async read() {
    try {
      return await OrdemServico.find().sort({ dataAbertura: -1 });
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      const os = await OrdemServico.findById(id);
      if (!os) throw new Error("Ordem de Serviço não encontrada.");
      return os;
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    try {
      const deletada = await OrdemServico.findByIdAndDelete(id);
      if (!deletada) throw new Error("OS não encontrada");
      return deletada;
    } catch (error) {
      throw error;
    }
  }
  async getOptions() {
    try {
      const [setores, solicitantes, executores, prioridades, situacoes] =
        await Promise.all([
          OrdemServico.distinct("setor"),
          OrdemServico.distinct("solicitante"),
          OrdemServico.distinct("executor"),
          OrdemServico.distinct("prioridade"),
          OrdemServico.distinct("situacao"),
        ]);

      return {
        setores: setores.filter(Boolean).sort(),
        solicitantes: solicitantes.filter(Boolean).sort(),
        executores: executores.filter(Boolean).sort(),
        prioridades: prioridades.filter(Boolean).sort(),
        situacoes: situacoes.filter(Boolean).sort(),
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new OSService();
