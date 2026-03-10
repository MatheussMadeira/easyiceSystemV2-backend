const createGenericRouter = require("./genericRouter");
const GenericController = require("../controllers/genericController");
const { PrioridadeService } = require("../services/configServices");

const prioridadeCtrl = new GenericController(PrioridadeService);

module.exports = createGenericRouter(prioridadeCtrl);
