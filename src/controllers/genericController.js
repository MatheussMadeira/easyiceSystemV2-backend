class GenericController {
  constructor(service) {
    this.service = service;
  }

  async create(req, res) {
    try {
      const novo = await this.service.create(req.body);
      return res.status(201).json(novo);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async read(req, res) {
    try {
      const filtros = req.query;

      const itens = await this.service.getAll(filtros);
      return res.json(itens);
    } catch (error) {
      return res.status(500).json({ erro: error.message });
    }
  }

  async update(req, res) {
    try {
      const atualizado = await this.service.update(req.params.id, req.body);
      if (!atualizado)
        return res.status(404).json({ erro: "Item não encontrado" });
      return res.json(atualizado);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async delete(req, res) {
    try {
      const deletado = await this.service.delete(req.params.id);
      if (!deletado)
        return res.status(404).json({ erro: "Item não encontrado" });
      return res.json({ mensagem: "Removido com sucesso!" });
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
  }
}

module.exports = GenericController;
