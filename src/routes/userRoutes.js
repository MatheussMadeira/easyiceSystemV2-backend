const createGenericRouter = require("./genericRouter");
const GenericController = require("../controllers/genericController");
const UserService = require("../services/userService");

const userCtrl = new GenericController(UserService);

module.exports = createGenericRouter(userCtrl);