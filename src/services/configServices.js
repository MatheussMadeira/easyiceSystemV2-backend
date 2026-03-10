const GenericService = require("./genericService");
const UserService = require("./userService");
const { Setor, Prioridade } = require("../models/GenericName");

const SetorService = new GenericService(Setor);
const PrioridadeService = new GenericService(Prioridade);

const { ExecutorService, SolicitanteService } = require("./userService");

module.exports = {
  SetorService,
  PrioridadeService,
  ExecutorService,
  SolicitanteService,
};
