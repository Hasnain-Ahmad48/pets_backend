const express = require("express");
const multer = require("multer");
const path = require("path");
var middleware = require("../../middleware/middleware.js");
const videoController = require("../../controller/Videos/videoController.js");

const router = express.Router();

// MULTER CONFIG
const storage = multer.diskStorage({
  destination: "public/videos/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname),
    );
  },
});

const upload = multer({storage});

// ROUTES

router.post(
  "/addvideo",
  middleware.hasPermission_v2("Video", "Add"),
  upload.fields([{name: "video", maxCount: 1}]),
  videoController.addVideoController,
);

router.get("/getvideo", videoController.getVideosController);

router.put(
  "/updatevideo/:id",
  // middleware.hasPermission_v2("Video", "Edit"),
  upload.fields([{name: "video", maxCount: 1}]),
  videoController.updateVideoController,
);

router.delete("/deletevideo/:id", videoController.deleteVideoController);

router.post(
  "/videoviews/:id/view",
  middleware.validateToken,
  videoController.addViewController,
);

router.post(
  "/videolikes/:id/like",
  middleware.validateToken,
  videoController.addLikeController,
);

module.exports = router;
