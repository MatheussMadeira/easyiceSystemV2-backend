const express = require("express");
const router = express.Router();

const setorRoutes = require("./setorRoutes");
const userRoutes = require("./userRoutes");
const prioridadeRoutes = require("./prioridadeRoutes");
const osRoutes = require("./osRoutes");
const authRoutes = require("./authRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/setores", setorRoutes);
router.use("/prioridades", prioridadeRoutes);
router.use("/os", osRoutes);

module.exports = router;
