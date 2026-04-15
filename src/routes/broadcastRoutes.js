const express = require("express");
const router = express.Router();
const { sendBroadcast } = require("../controllers/broadcastController");
const permitir = require("../auth/authMiddleware");

router.post(
  "/send",
  (req, res, next) => {
    console.log("🔥 ROTA BROADCAST ALCANÇADA!");
    console.log(
      "Headers:",
      req.headers.authorization ? "Token presente" : "SEM TOKEN"
    );
    next();
  },
  permitir(["ADMIN"]),
  sendBroadcast
);

module.exports = router;
