var express = require("express");
var PagesController = require("../../controller/Pages/PagesController.js");

var router = express.Router();

router.get("/getpages", PagesController.getPages);
router.get(
  "/countPage",

  PagesController.getPageCount
);

module.exports = router;
