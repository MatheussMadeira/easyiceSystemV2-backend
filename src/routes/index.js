const express = require("express");
const router = express.Router();

router.get("/public/ping", (req, res) => {
  res.status(200).json({ status: "ok", message: "Servidor ativo!" });
});
const equipamentoRoutes = require("./equipamentoRoutes");
const setorRoutes = require("./setorRoutes");
const userRoutes = require("./userRoutes");
const prioridadeRoutes = require("./prioridadeRoutes");
const osRoutes = require("./osRoutes");
const authRoutes = require("./authRoutes");
const logRoutes = require("./logRoutes");
const servicoRoutes = require("./servicoRoutes");
const zapiRoutes = require("./zapiRoutes");
const broadcastRoutes = require("./broadcastRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/setores", setorRoutes);
router.use("/prioridades", prioridadeRoutes);
router.use("/os", osRoutes);
router.use("/logs", logRoutes);
router.use("/servico", servicoRoutes);
router.use("/whatsapp", zapiRoutes);
router.use("/equipamentos", equipamentoRoutes);
router.use("/broadcast", broadcastRoutes);

module.exports = router;
