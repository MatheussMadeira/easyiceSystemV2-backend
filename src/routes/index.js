const express = require("express");
const router = express.Router();
router.get("/public/ping", (req, res) => {
  res.status(200).json({ status: "ok", message: "Servidor ativo!" });
});

const setorRoutes = require("./setorRoutes");
const userRoutes = require("./userRoutes");
const prioridadeRoutes = require("./prioridadeRoutes");
const osRoutes = require("./osRoutes");
const authRoutes = require("./authRoutes");
const logRoutes = require("./logRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/setores", setorRoutes);
router.use("/prioridades", prioridadeRoutes);
router.use("/os", osRoutes);
router.use("/logs", logRoutes);

module.exports = router;
