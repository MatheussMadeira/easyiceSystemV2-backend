const createGenericRouter = require("./genericRouter");
const GenericController = require("../controllers/GenericController");
const UserService = require("../services/userService");

const userCtrl = new GenericController(UserService);

module.exports = createGenericRouter(userCtrl);
