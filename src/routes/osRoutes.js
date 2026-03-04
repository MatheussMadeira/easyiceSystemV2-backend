const express = require("express");
const router = express.Router();
const osController = require("../controllers/osController");
const upload = require("../config/multer");

const uploadFields = upload.fields([
  { name: "arquivoAbertura", maxCount: 1 },
  { name: "arquivoFechamento", maxCount: 1 },
]);

router.post("/", uploadFields, (req, res) => osController.create(req, res));
router.get("/", (req, res) => osController.read(req, res));
router.get("/opcoes", (req, res) => osController.getOptions(req, res));
router.get("/proximo-numero", (req, res) => osController.getNext(req, res));
router.patch("/:id/inline", osController.updateInline);
router.get("/:id", (req, res) => osController.findById(req, res));

router.put("/:id", uploadFields, (req, res) => osController.update(req, res));

router.delete("/:id", (req, res) => osController.delete(req, res));

module.exports = router;
