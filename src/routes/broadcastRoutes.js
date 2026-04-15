const express = require("express");
const router = express.Router();
const { sendBroadcast } = require("../controllers/broadcastController");
const authMiddleware = require("../auth/authMiddleware");

router.post("/send", authMiddleware, sendBroadcast);

module.exports = router;
