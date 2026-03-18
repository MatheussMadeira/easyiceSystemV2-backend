const GenericController = require("./genericController");
const Log = require("../models/Log");

class LogController extends GenericController {
  constructor() {
    super(Log);
  }

  async read(req, res) {
    try {
      const logs = await Log.find().sort({ data: -1 }).limit(100);
      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ erro: error.message });
    }
  }
}

module.exports = new LogController();
