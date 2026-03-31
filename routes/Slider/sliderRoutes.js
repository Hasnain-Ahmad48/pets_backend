const express = require("express");
const path = require("path");
const multer = require("multer");
const SliderController = require("../../controller/Slider/sliderController");
const middleware = require("../../middleware/middleware");
const router = express.Router();

var storage = multer.diskStorage({
  destination: "public/Slider/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
var upload = multer({ storage: storage });

router.post(
  "/createSlider",
  upload.array("images"),
  SliderController.createSlider
);

router.get(
  "/getallimages",

  SliderController.getAllImages
);
router.delete("/deleteSlider/:id", SliderController.deleteSlider);
router.put(
  "/updateSlider/:id",
  upload.array("images"),
  SliderController.updateSlider
);
module.exports = router;
