const express = require("express");

const router = express.Router();

const tagsController = require("../../controller/tagsController/tagsController.js");
const authMiddleware = require("../../middleware/middleware.js");

router.post(
  "/addtag",
  authMiddleware.validateToken,
  tagsController.createTagController,
);

router.get(
  "/getalltags",
  //  authMiddleware.validateToken,
  tagsController.getTagsController,
);

router.put(
  "/updatetag/:id",
  authMiddleware.validateToken,
  tagsController.updateTagController,
);
router.delete(
  "/deletetag/:id",
  authMiddleware.validateToken,
  tagsController.deleteTagController,
);

module.exports = router;
