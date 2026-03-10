const createGenericRouter = require("./genericRouter");
const GenericController = require("../controllers/GenericController");
const { SetorService } = require("../services/configServices");

const setorCtrl = new GenericController(SetorService);

module.exports = createGenericRouter(setorCtrl);
