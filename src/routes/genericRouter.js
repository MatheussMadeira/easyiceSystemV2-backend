const express = require("express");

const createGenericRouter = (controller) => {
  const router = express.Router();

  router.get("/", (req, res) => controller.read(req, res));
  router.post("/", (req, res) => controller.create(req, res));
  router.put("/:id", (req, res) => controller.update(req, res));
  router.delete("/:id", (req, res) => controller.delete(req, res));
  if (controller.updatePassword) {
    router.put("/:id/senha", (req, res) => controller.updatePassword(req, res));
  }
  return router;
};

module.exports = createGenericRouter;
