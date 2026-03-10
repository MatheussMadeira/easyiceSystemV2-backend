const createGenericRouter = require("./genericRouter");
const GenericController = require("../controllers/genericController");
const { SetorService } = require("../services/configServices");

const setorCtrl = new GenericController(SetorService);

module.exports = createGenericRouter(setorCtrl);
