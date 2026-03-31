const express = require("express");
const mkProductCategoryController = require("../../controller/mk_product_Category/mkProductCategoryController");
const multer = require("multer");
const path = require("path");
const router = express.Router();




var storage = multer.diskStorage({
  destination: "public/mkProductCategory/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});
var uploads = multer({ storage: storage });

router.post(
  "/createProductCategory",
  mkProductCategoryController.createProductCategory
);

router.get(
  "/getAllProductCategory",
  mkProductCategoryController.getAllProductCategory
);

router.post(
  "/PostProductCategories",
  uploads.single("image"),
  mkProductCategoryController.PostProductCategoriesController
);
router.get(
  "/getAllProductCategories",
  mkProductCategoryController.getAllProductCategoriesController
);
router.get(
  "/getCountCategoryProduct",
  mkProductCategoryController.getAllProductCategoryCountController
);


router.get(
  "/getsubCategoryForCategory/:slug",
  mkProductCategoryController.getSubCategoryForCategoryController
);
module.exports = router;
