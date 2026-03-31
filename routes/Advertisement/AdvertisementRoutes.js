var express = require("express");
var AdvertisementController = require("../../controller/Advertisement/AdvertisementController.js");
var multer = require("multer");
var path = require("path");
var middleware = require("../../middleware/middleware.js");
var router = express.Router();

var storage = multer.diskStorage({
  destination: "public/Advertisement/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({ storage: storage });

router.post(
  "/createAdvertiserment",

  upload.array("images"),
  AdvertisementController.createAdvertiserment
);

router.get(
  "/getadvertisement/:page",
  middleware.hasPermission,
  AdvertisementController.getAdvertisement
);
router.get(
  "/getadvertisementbytoken",
  middleware.hasPermission,

  AdvertisementController.getAdvertisementbyUserToken
);
router.delete(
  "/deleteadvertisement/:id",

  AdvertisementController.deleteAdvertisement
);

router.get(
  "/getadvertisementbyid/:id",
  middleware.hasPermission,

  AdvertisementController.getAdvertisementForStatusById
);

router.put(
  "/updateadvertisementstatus/:id",

  //  middleware.validateToken,
  AdvertisementController.updateAvertisementStatus
);

module.exports = router;
