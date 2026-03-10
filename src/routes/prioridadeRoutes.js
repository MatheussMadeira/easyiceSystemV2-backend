const createGenericRouter = require("./genericRouter");
const GenericController = require("../controllers/GenericController");
const { PrioridadeService } = require("../services/configServices");

const prioridadeCtrl = new GenericController(PrioridadeService);

module.exports = createGenericRouter(prioridadeCtrl);
