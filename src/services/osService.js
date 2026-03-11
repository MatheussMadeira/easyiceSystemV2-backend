const OrdemServico = require("../models/OrdemServico");
const User = require("../models/User");
const { Setor, Prioridade } = require("../models/GenericName");

class OSService {
  // Busca o próximo número baseado na última OS (Garante sequência a partir da 1270)
  async getNextNumber() {
    try {
      const ultimaOS = await OrdemServico.findOne({}, { numeroOS: 1 })
        .sort({ numeroOS: -1 })
        .collation({ locale: "en_US", numericOrdering: true });

      if (!ultimaOS || !ultimaOS.numeroOS) return 1000;
      return Number(ultimaOS.numeroOS) + 1;
    } catch (error) {
      console.error("Erro ao buscar próximo número:", error);
      return 1000;
    }
  }

  // CRIAÇÃO: Validação Híbrida (Mestre + Histórico)
  async create(dados, arquivos) {
    try {
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

      if (!setorMestre && !setorHist) throw new Error(`Setor inválido.`);
      if (!solicitanteMestre && !solicitanteHist)
        throw new Error(`Solicitante inválido.`);
      if (!prioridadeMestre && !prioridadeHist)
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
      console.error("Erro no Create Service:", error.message);
      throw error;
    }
  }

  async getOptions() {
    try {
      console.log("--- BUSCANDO OPÇÕES DIRETAS DO BANCO ---");

     
      const [sDocs, solDocs, exeDocs, priDocs] = await Promise.all([
        Setor.find({}, "nome").sort({ nome: 1 }),
        User.find(
          {
            funcoes: { $in: ["SOLICITANTE", "ADMIN"] },
            ativo: true,
          },
          "nome"
        ).sort({ nome: 1 }),
        User.find(
          {
            funcoes: { $in: ["EXECUTOR", "ADMIN"] },
            ativo: true,
          },
          "nome"
        ).sort({ nome: 1 }),
        Prioridade.find({}, "nome").sort({ nome: 1 }),
      ]);

      console.log("Docs encontrados no banco:", {
        setores: sDocs.length,
        solicitantes: solDocs.length,
        executores: exeDocs.length,
      });


      return {
        setores: sDocs.map((d) => d.nome.toUpperCase()),
        solicitantes: solDocs.map((d) => d.nome.toUpperCase()),
        executores: exeDocs.map((d) => d.nome.toUpperCase()),
        prioridades: priDocs.map((d) => d.nome.toUpperCase()),
        situacoes: ["EM ABERTO", "EM PROCESSO", "CONCLUÍDO", "CANCELADA"],
      };
    } catch (error) {
      console.error("Erro no getOptions Service:", error);
      throw error;
    }
  }

  async update(id, dados, arquivos) {
    try {
      const osParaAtualizar = await OrdemServico.findById(id);
      if (!osParaAtualizar) throw new Error("OS não encontrada.");

      if (osParaAtualizar.situacao === "CONCLUÍDO") {
        throw new Error("Esta Ordem de Serviço já se encontra CONCLUÍDA.");
      }

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

      return await OrdemServico.findByIdAndUpdate(
        id,
        { $set: camposParaAtualizar },
        { new: true, runValidators: true }
      );
    } catch (error) {
      console.error("Erro no Update Service:", error.message);
      throw error;
    }
  }

  // Métodos de leitura e deleção (Simples)
  async read() {
    return await OrdemServico.find().sort({ dataAbertura: -1 });
  }

  async findById(id) {
    const os = await OrdemServico.findById(id);
    if (!os) throw new Error("Ordem de Serviço não encontrada.");
    return os;
  }

  async delete(id) {
    const deletada = await OrdemServico.findByIdAndDelete(id);
    if (!deletada) throw new Error("OS não encontrada");
    return deletada;
  }

  async updateGeneric(id, dados) {
    return await OrdemServico.findByIdAndUpdate(
      id,
      { $set: dados },
      { returnDocument: "after", runValidators: true }
    );
  }
}

module.exports = new OSService();
