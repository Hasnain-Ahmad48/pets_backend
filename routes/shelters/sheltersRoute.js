var express = require("express");
var multer = require("multer");
var path = require("path");

var shelterController = require("../../controller/shelters/sheltersController.js");
var middleware = require("../../middleware/middleware.js");

var router = express.Router();

var storage = multer.diskStorage({
  destination: "public/Breeds/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({ storage: storage });


 
router.get("/:slug?", shelterController.getShelters);
module.exports = router;