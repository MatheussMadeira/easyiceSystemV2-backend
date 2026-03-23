const express = require("express");
const router = express.Router();
const Controller = require("../controllers/servicoController");

router.get("/logs", Controller.buscarLogs);

router.patch("/executar/:id", Controller.registrarExecucao);
router.post("/", Controller.store);
router.get("/", Controller.index);
router.put("/:id", Controller.update);
router.delete("/:id", Controller.delete);

module.exports = router;
