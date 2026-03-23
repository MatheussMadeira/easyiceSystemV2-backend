const ServicoFrequente = require("../models/ServicoFrequente");
const LogServico = require("../models/LogServico");

class ServicoFrequenteService {
  async create(dados) {
    const hoje = new Date();
    const proxima = new Date();
    proxima.setDate(hoje.getDate() + Number(dados.periodicidadeDias));

    const novoServico = new ServicoFrequente({
      ...dados,
      proximaExecucao: proxima,
    });

    return await novoServico.save();
  }

  async getAll() {
    return await ServicoFrequente.find().sort({ proximaExecucao: 1 });
  }

  // ADICIONE ESTA FUNÇÃO PARA A PÁGINA DE GERÊNCIA
  async getAllLogs() {
    return await LogServico.find().sort({ dataExecucao: -1 });
  }

  async update(id, dados) {
    return await ServicoFrequente.findByIdAndUpdate(id, dados, { new: true });
  }

  async delete(id) {
    return await ServicoFrequente.findByIdAndDelete(id);
  }

  async registrarExecucao(id) {
    const servico = await ServicoFrequente.findById(id);

    if (!servico) throw new Error("Serviço não encontrado");

    const hoje = new Date();
    const dataPlanejada = servico.proximaExecucao
      ? new Date(servico.proximaExecucao)
      : hoje;

    const diffTime = hoje - dataPlanejada;
    const atrasoDias = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    await LogServico.create({
      servicoId: servico._id,
      nomeServico: servico.nome,
      executor: servico.executorPadrao,
      dataExecucao: hoje,
      dataPlanejada: dataPlanejada,
      atrasoDias: atrasoDias > 0 ? atrasoDias : 0,
      status: atrasoDias > 0 ? "ATRASADO" : "NO PRAZO",
    });

    const novaProxima = new Date();
    novaProxima.setDate(
      hoje.getDate() + (parseInt(servico.periodicidadeDias) || 15)
    );

    servico.ultimaExecucao = hoje;
    servico.proximaExecucao = novaProxima;

    return await servico.save();
  }
}

module.exports = new ServicoFrequenteService();
