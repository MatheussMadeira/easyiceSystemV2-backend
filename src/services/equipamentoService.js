const Equipamento = require("../models/Equipamento");
const normalizarTexto = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
};
class EquipamentoService {
  async read(filtros) {
    let query = {};

    if (filtros && filtros.setor && filtros.setor.trim() !== "") {
      query.setor = { $regex: filtros.setor.trim(), $options: "i" };
    }

    const equipamentos = await Equipamento.find(query).sort({ numero: 1 });

    return equipamentos;
  }
  async getProximoNumero() {
    const equipamentos = await Equipamento.find().select("numero").lean();

    if (!equipamentos || equipamentos.length === 0) return 1;

    const numeros = equipamentos
      .map((e) => parseInt(e.numero))
      .filter((n) => !isNaN(n));

    const maiorNumero = Math.max(...numeros);

    return maiorNumero + 1;
  }
  async create(dados) {
    const proximoNumero = await this.getProximoNumero();
    const dadosCompletos = {
      ...dados,
      setor: normalizarTexto(dados.setor),
      numero: proximoNumero,
    };
    const duplicado = await Equipamento.findOne({
      nome: { $regex: new RegExp(`^${dados.nome.trim()}$`, "i") },
      setor: dados.setor,
    });

    if (duplicado) {
      throw new Error(
        `O equipamento "${dados.nome}" já está cadastrado no setor ${dados.setor}.`
      );
    }
    const novoEquipamento = await Equipamento.create(dadosCompletos);

    return novoEquipamento;
  }

  async update(id, dados) {
    const equipamentoAtualizado = await Equipamento.findByIdAndUpdate(
      id,
      dados,
      { new: true }
    );
    if (!equipamentoAtualizado) throw new Error("Equipamento não encontrado.");
    return equipamentoAtualizado;
  }

  async delete(id) {
    const equipamentoRemovido = await Equipamento.findByIdAndDelete(id);
    if (!equipamentoRemovido) throw new Error("Equipamento não encontrado.");
    return equipamentoRemovido;
  }

  async insertMany(equipamentosData) {
    await Equipamento.deleteMany({});
    const inseridos = await Equipamento.insertMany(equipamentosData);
    return inseridos;
  }
}

module.exports = new EquipamentoService();
