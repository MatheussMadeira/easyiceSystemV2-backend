
class GenericService {
  constructor(model) {
    this.model = model;
  }

  async getAll(filtros = {}) {
    return await this.model.find(filtros).sort({ nome: 1 });
  }

  async create(dados) {
    const existe = await this.model.findOne({ nome: dados.nome });
    if (existe) throw new Error("Este registro já existe.");
    return await this.model.create(dados);
  }

  async update(id, dados) {
    const atualizado = await this.model.findByIdAndUpdate(id, dados, {
      new: true,
    });
    if (!atualizado) throw new Error("Registro não encontrado.");
    return atualizado;
  }

  async delete(id) {
    const deletado = await this.model.findByIdAndDelete(id);
    if (!deletado) throw new Error("Registro não encontrado.");
    return deletado;
  }
}

module.exports = GenericService;
