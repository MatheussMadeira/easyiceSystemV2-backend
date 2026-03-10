const createGenericRouter = require("./GenericRouter");
const GenericController = require("../controllers/GenericController");
const { SetorService } = require("../services/configServices");

const setorCtrl = new GenericController(SetorService);

module.exports = createGenericRouter(setorCtrl);
