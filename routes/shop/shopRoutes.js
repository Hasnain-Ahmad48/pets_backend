const express = require("express");
const shopController = require("../../controller/shop/shopController");
const multer = require("multer");
var path = require("path");
const router = express.Router();

// Configure Multer for handling image uploads
var storage = multer.diskStorage({
  destination: "public/shop/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({ storage: storage });
router.post(
  "/createshop",
  upload.fields([
    { name: "shopCoverPhoto", maxCount: 1 },
    { name: "shopIconPhoto", maxCount: 1 },
  ]),
  shopController.createShopController
);
router.get("/getshops", shopController.getAllShopsController);
router.get("/shopTags", shopController.getTagsController);
router.get("/getshop/:id", shopController.getShopByIdController);

router.delete("/deleteshop/:id", shopController.deleteShopController);

module.exports = router;
