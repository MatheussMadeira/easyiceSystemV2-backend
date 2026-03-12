const createGenericRouter = require("./genericRouter");
const userController = require("../controllers/userController");

module.exports = createGenericRouter(userController);
